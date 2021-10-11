/*
* Function which  helps to split the value on every button(Edit, Delete, view) and send it to the url
*/
function OpenBtnPage(id) {

    if (typeof id !== "undefined" && id !== null) {
        var result = id.split("_");

        window.location.replace("index.html?id=" + result[1] + "&mode=" + result[0] + "&type=" + result[2] + "&formname=" + result[3]);
    }

}

/*
   * This part of the code retrieve values in the url and help to do one get request to create a form with its schema
   * and defaut value if the form is an edit mode. With the values getting in the url, a put method is requested to edit an form. 
   * Even delete a table values is done within this script below 
   */
if (typeof GetURLParameter('id') !== "undefined" && GetURLParameter('id') !== null &&
    typeof GetURLParameter('mode') !== "undefined" && GetURLParameter('mode') !== null &&
    typeof GetURLParameter('type') !== "undefined" && GetURLParameter('type') !== null &&
    typeof GetURLParameter('formname') !== "undefined" && GetURLParameter('formname') !== null) {
    localStorage.setItem("message", "");
    var wrapperForm = document.getElementById("contentTab");
    var payloadWrapper = document.getElementById("displayPlayload");
    var header_name = decodeURIComponent(GetURLParameter('formname'));

    var payloadHTML = "";
    var myHTML = "";
    var urlParameter = GetURLParameter('mode');
    getData("/objects/?query=type:" + GetURLParameter('type') + " AND /id" + GetURLParameter('id'))
        .then(response => response.json())
        .then(datas => {
            if (!!datas) {
                if (datas.results[0].payloads) {
                    datas.results[0].payloads.forEach(elt => {
                        console.log(elt);
                        fetch(CORDRA_HTTPS_URL + '/objects/' + datas.results[0].content['@id'] + '?' + new URLSearchParams({ payload: 'upload', disposition: 'attachment' }).toString(), {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ' + authdata['token'],
                            }
                        }).then(response => validateResponse(response))
                            .then(Blod => readResponseAsBlob(Blod))
                            .then(value => showImage(value, elt.filename))
                            .catch(error => logError(error));

                        payloadHTML += "<a href=" + CORDRA_HTTPS_URL + "/objects/" + datas.results[0].content['@id'] + "?payload=upload download=" + CORDRA_HTTPS_URL + "/objects/" + datas.results[0].content['@id'] + "?payload=upload >" + elt.filename + "</a>";
                    });
                }

                if (urlParameter === "edit") {
                    //edit mode is where the user can edit a form
                    myHTML += "<h1 class='page-header'>" + header_name.charAt(0).toUpperCase() + header_name.slice(1) + "</h1>";
                    myHTML += "<form id=" + datas.results[0].content['formAlternateName'] + "> </form>";
                    wrapperForm.innerHTML = myHTML;
                    getData("/objects/?query=jsonform AND /alternateName:" + datas.results[0].content['formAlternateName'])
                        .then(response => response.json())
                        .then(data => {
                            var formatValues = { "enum": [], "titleMap": {} };
                            var values = {};
                            var selectValues = [];
                            data.results.forEach(element => {
                                var queries = element.content.form.filter(item => {
                                    if (item.cordra) {
                                        return item.cordra;
                                    }
                                });
                                if (queries.length > 0) {
                                    getData("/objects/?query=" + queries[0].cordra.query + "&filter=['/content/@id','/content/name']")
                                        .then(response => response.json())
                                        .then(data => {
                                            data.results.forEach(elt => {
                                                selectValues.push(elt.content['@id']);
                                                values[elt.content['@id']] = elt.content['name'];

                                            });
                                            formatValues.enum = selectValues;
                                            formatValues.titleMap = values;

                                            element.content.form.forEach(item => {
                                                if (item.cordra) {
                                                    item.titleMap = values;
                                                    element.content.schema[item.key].enum = selectValues;
                                                }
                                            });
                                            
                                            modifiedForm(element.content, datas);
                                        });

                                } else {
                                    modifiedForm(element.content, datas);
                                }

                            });
                        });
                } else if (GetURLParameter('mode') === "view") {

                    // retrieving image https://sandbox.materialhub.org/objects/prefix/4fa85d7e562fcd1d251a?payload=filename
                    // View mode is where all values are available in certain format
                    //wrapperForm.appendChild(prettyPrint(datas.results));
                    localStorage.setItem("message", "");
                    var page_name = "<h1 class='page-header'>" + header_name.charAt(0).toUpperCase() + header_name.slice(1);
                    page_name += "<span class='page-header' style='float: right; margin-left: 10px;margin-right: 20px;'><button type='button' class='btn btn-primary' onclick=OpenBtnPage('edit_" + GetURLParameter('id') + "_" + GetURLParameter('type') + "_" + GetURLParameter('formname') + "')>"
                        + "<span class='glyphicon glyphicon-pencil'></span></button><button type='button' class='btn btn-danger' data-toggle='modal' data-target='#delete" + GetURLParameter('id').split("/")[1] + "'>"
                        + "<span class='glyphicon glyphicon-remove'></span></button><button type='button' class='btn btn-primary' data-toggle='modal' data-id='" + GetURLParameter('id') + "_" + datas.results[0].metadata["createdBy"] + "' data-target='#shareModal'>"
                        + "<i class='fas fa-share-alt'></i></button></h1>";
                    page_name += "<div class='modal fade' id='delete" + GetURLParameter('id').split("/")[1] + "' tabindex='-1' role='dialog' aria-labelledby='myModalLabel'>"
                        + "<div class='modal-dialog modal-sm' role='document'>"
                        + " <div class='modal-content'>"
                        + "<div class='modal-body'>"
                        + "Do you want to delete : <strong>" + GetURLParameter('id') + "</strong> ?"
                        + "</div>"
                        + "<div class='modal-footer'>"
                        + "<button type='button' class='btn btn-default' data-dismiss='modal'>No</button>"
                        + "<button type='button' class='btn btn-primary' onclick=OpenBtnPage('delete_" + GetURLParameter('id') + "_" + GetURLParameter('type') + "_" + GetURLParameter('formname') + "')>Yes</button>"
                        + "</div>"
                        + "</div>"
                        + "</div>"
                        + "</div>";
                    page_name += "<div class='modal fade' id='shareModal' role='dialog'  tabindex='-1'  >"
                        + "<div class='modal-dialog modal-lg' role='document'>"
                        + " <div class='modal-content'>"
                        + "  <div class='modal-header'>"
                        + "<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"
                        + "<h4 class='modal-title' id='myModalLabel'>Share</h4>"
                        + "</div>"
                        + "<div class='modal-body'>"
                        + "<form id='acl_user' class='form-inline'>"
                        + "<div class='form-group' id='select_drop'>"
                        + "</div>"
                        + "<div class='checkbox'> <label>"
                        + "<input type='checkbox' id='read' class='form-check-input' name='read' value='read' required>Can Read"
                        + "</label></div>"
                        + "<div class='checkbox'> <label>"
                        + "<input type='checkbox' id='write' class='form-check-input'  name='write' value='write' required>Can write"
                        + "</label></div>"
                        + "<button  type='submit' id='submit_btn' class='btn btn-default'>Add</button>"
                        + "</form>"
                        + "<hr>"
                        + "<div id='table_user'></div>"
                        + "</div>"
                        + "<div class='modal-footer'>"
                        + "</div>"
                        + "</div>"
                        + "</div>"
                        + "</div>";
                    myHTML += "<form id=" + datas.results[0].content['formAlternateName'] + "> </form>";
                    wrapperForm.innerHTML = myHTML;
                    document.getElementById("page-header").innerHTML = page_name;
                    getData("/objects/?query=jsonform AND /alternateName:" + datas.results[0].content['formAlternateName'])
                        .then(response => response.json())
                        .then(data => {
                            var formatValues = { "enum": [], "titleMap": {} };
                            var values = {};
                            var selectValues = [];
                            data.results.forEach(element => {
                                var queries = element.content.form.filter(item => {
                                    if (item.cordra) {
                                        return item.cordra;
                                    }
                                });
                                if (queries.length > 0) {
                                    getData("/objects/?query=" + queries[0].cordra.query + "&filter=['/content/@id','/content/name']")
                                        .then(response => response.json())
                                        .then(data => {
                                            data.results.forEach(elt => {
                                                selectValues.push(elt.content['@id']);
                                                values[elt.content['@id']] = elt.content['name'];

                                            });
                                            formatValues.enum = selectValues;
                                            formatValues.titleMap = values;

                                            element.content.form.forEach(item => {
                                                if (item.cordra) {
                                                    item.titleMap = values;
                                                    element.content.schema[item.key].enum = selectValues;
                                                }
                                            });
                                            $('form#' + element.content.alternateName).jsonForm({
                                                "schema": element.content.schema,
                                                "form": element.content.form,
                                                "value": datas.results[0].content

                                            });
                                            var form = document.getElementById(datas.results[0].content['formAlternateName']);
                                            var elements = form.elements;
                                            for (var i = 0; i < elements.length; ++i) {
                                                elements[i].disabled = true;
                                            }
                                        });

                                } else {
                                    $('form#' + element.content.alternateName).jsonForm({
                                        "schema": element.content.schema,
                                        "form": element.content.form,
                                        "value": datas.results[0].content

                                    });
                                }


                            });
                            var form = document.getElementById(datas.results[0].content['formAlternateName']);
                            var elements = form.elements;
                            for (var i = 0; i < elements.length; ++i) {
                                elements[i].disabled = true;
                            }
                        });

                    $('#shareModal').on('hidden.bs.modal', function (e) {
                        $('#acl_user')[0].reset();
                        location.reload();
                    });
                    $('#shareModal').on('show.bs.modal', function (event) {

                        var button = $(event.relatedTarget); // Button that triggered the modal
                        var split_values = button.data('id'); // Extract info from data-* attributes   
                        split_values = split_values.split("_");
                        var recipient = split_values[0];

                        var userIdCreateEntry = split_values[1];

                        $('#submit_btn').click(function (e) {
                            e.preventDefault();

                            var data = {
                                readers: [],
                                writers: []
                            };

                            if ($('#read').is(":checked")) {
                                data.readers = $('#drop').val();
                            }
                            if ($('#write').is(":checked")) {
                                data.writers = $('#drop').val();
                            }

                            if (data.writers === null && data.readers === null) {
                                alert("You must select a user");
                            } else {
                                if (data.writers.length === 0 && data.readers.length === 0) {
                                    alert("You must check at least one box");
                                } else {
                                    getData("/acls/" + recipient).then(response => response.json())
                                        .then(acl_datas => {
                                            if (!!acl_datas && typeof acl_datas.readers !== "undefined" && acl_datas.readers !== null
                                                && typeof acl_datas.writers !== "undefined" && acl_datas.writers !== null) {
                                                data.readers = data.readers.concat(acl_datas.readers);
                                                data.writers = data.writers.concat(acl_datas.writers);

                                            }
                                            putData('/acls/' + recipient, data).then(respons => {
                                                if (respons.status == 200) {
                                                    $('#acl_user')[0].reset();
                                                    data = {};
                                                    $('#drop').multiselect('refresh');
                                                    loadTable(recipient, userIdCreateEntry);
                                                    dropdown(recipient);
                                                }
                                            });

                                        });
                                }

                            }

                        });
                        loadTable(recipient, userIdCreateEntry);
                        dropdown(recipient);

                    });



                } else if (GetURLParameter('mode') === "delete") {

                    deleteData('/objects/' + GetURLParameter('id'))
                        .then(response => {
                            if (response.status == 200) {
                                console.log("Successful");
                                localStorage.setItem("message", "The entry was deleted successfully.");
                                window.location.replace(localStorage.getItem("redirect"));

                            }
                        });
                }

                //payloadWrapper.innerHTML = payloadHTML;
            }


        });

}

function readResponseAsBlob(response) {
    return response.blob();
}
function showImage_tb(responseAsBlob, filename,name) {
    if (responseAsBlob.type && responseAsBlob.type.includes("image")) {
        var displayPlayload = document.getElementById(filename);
        var imgElem = document.createElement('img');
        var imgUrl = URL.createObjectURL(responseAsBlob);
        var link = document.createTextNode(filename);
        const a = document.createElement('a');
        imgElem.style.cssText = "width:100px;height:100px;";
        imgElem.src = imgUrl;
        a.appendChild(imgElem);
        a.href = imgUrl;
        a.download = name+"."+responseAsBlob['type'].split('/')[1];
        a.title = name+"."+responseAsBlob['type'].split('/')[1];
        const clickHandler = () => {
            setTimeout(() => {
                URL.revokeObjectURL(imgUrl);
                this.removeEventListener('click', clickHandler);
            }, 150);
        }
        a.addEventListener('click', clickHandler, false);
        displayPlayload.appendChild(a);
        return imgElem;
    }
}
function showImage(responseAsBlob, filename) {
    var container = document.getElementById('link');
    var displayPlayload = document.getElementById('displayPlayload');
    var imgElem = document.createElement('img');
    var imgUrl = URL.createObjectURL(responseAsBlob);
    var link = document.createTextNode(filename)
    const a = document.createElement('a');
    imgElem.style.cssText = "width:100%";
    displayPlayload.appendChild(imgElem);
    a.appendChild(link);
    a.href = imgUrl;
    a.download = filename;
    a.title = filename;
    const clickHandler = () => {
        setTimeout(() => {
            URL.revokeObjectURL(imgUrl);
            this.removeEventListener('click', clickHandler);
        }, 150);
    }
    a.addEventListener('click', clickHandler, false);
    container.appendChild(a);
    imgElem.src = imgUrl;
    if (responseAsBlob.type && responseAsBlob.type.includes("image")) {
        if(displayPlayload) displayPlayload.appendChild(imgElem);
    }
}


function logError(error) {
    console.log('Looks like there was a problem: \n', error);
}

function validateResponse(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
function modifiedForm(content, datas) {
    var files = content.form.filter(item => item.type === "file");
    $('form#' + content.alternateName).jsonForm({
        "schema": content.schema,
        "form": content.form,
        "value": datas.results[0].content,
        "onSubmitValid": function (values) {
            if (!!document.querySelector('input[type=file]')){
                var data_form = new FormData();
                files.forEach(item => {
                    var file = document.querySelector('input[name=' + item['key'] + ']').files[0];
                    if (file) {
                        data_form.append(item['key'], document.querySelector('input[name=' + item['key'] + ']').files[0]);
                        values[item['key']] = values[item['key']] = CORDRA_HTTPS_URL + '/objects/' + datas.results[0].content['@id'] + '?' +
                            new URLSearchParams({ payload: item['key'], disposition: 'attachment' }).toString();
                    } else {
                        values[item['key']] = datas.results[0].content[item['key']];
                    }
                   
                });
                data_form.append('content', JSON.stringify(values));
                fetch(CORDRA_HTTPS_URL + '/objects/' + datas.results[0].content['@id'], {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + authdata['token'],
                    },
                    body: data_form
                }).then(r => {
                    if (r.status == 200) {
                        alert("The form was submitted successfully.");
                        localStorage.setItem("message", "The form was modified  successfully.");
                        $('form#' + content.alternateName)[0].reset();
                        window.location.replace(localStorage.getItem("redirect"));
                    }
                });
            } else {
                putData('/objects/' + datas.results[0].content['@id'], values)
                    .then(response => {
                        if (response.status == 200) {
                            alert("The form was submitted successfully.");
                            localStorage.setItem("message", "The form was modified  successfully.");
                            $('form#' + content.alternateName)[0].reset();
                            window.location.replace(localStorage.getItem("redirect"));
                        }
                    });
            }
        }
    });
}