function addAllFeaturesIran() {
    markerGroup.clearLayers();

    const style = {
        color: '#3388ff',
        weight: 1.3,
        opacity: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.1
    };

    allIranGeometry.features.forEach(feature => {
        const layer = L.geoJSON(feature, {style: style}).addTo(map);
        layer.on('click', function () {
            const jahadFeatures = [];
            const ostanName = feature.name;
            allGeometry.features.forEach(f => {
                const layerOstan = f.properties.ostan;
                if (ostanName === layerOstan) {
                    jahadFeatures.push(f);
                }
            });
            markerGroup.clearLayers();
            const geojson = {
                type: 'FeatureCollection',
                features: jahadFeatures
            };
            L.geoJSON(geojson, {
                onEachFeature: function (feature, layer) {
                    window.selectedLayer = layer;
                    const center = layer.getBounds().getCenter();
                    const lat = center.lat;
                    const lng = center.lng;
                    const category = feature.properties.tmelk;
                    const icon = icons[category] || icons['default'];
                    const marker = L.marker(center, {icon: icon}).addTo(markerGroup);
                    const name = layer.feature.properties['onvan'];
                    const dbId = layer.feature.properties.dbId;
                    const bounds = layer.getBounds();
                    const area = layer.feature.properties['arse'];
                    const newArea = Number.parseInt(area).toLocaleString('en-US');
                    const imageLink = layer.feature.properties['sardar'].replace('http://localhost:8088',
                        'http://185.213.164.61');
                    layer.on('click', function () {
                        window.selectedLayer = layer;  // اینجا لایه رو ذخیره می‌کنیم برای استفاده در تابع enablePolygonEditFromClick

                        const toolContent = `
                        <img src="${imageLink}" class="rounded" alt="سردر" width="100%" style="max-height: 300px">
                        <div class="tool-container text-right" dir="rtl">
                            <h6>${name}</h6>
                            <div class="tool-list justify-content-around text-center d-flex">
                                <div onclick="openLayerComment(${dbId})"  class="pointerCursor p-1 border border-secondary rounded m-1">
                                    <img src="${downloadSVG}" width="40px" alt="">
                                    <br>
                                    <small>یادداشت</small>
                                </div>
                                <div class="pointerCursor p-1 border border-secondary rounded m-1" onclick="printLayerDetails(${dbId}, '${lat}', '${lng}')">
                                    <img src="${detailSVG}" width="40px" alt="">
                                    <br>
                                    <small>جزئیات</small>
                                </div>
                                <div class="pointerCursor p-1 border border-secondary rounded m-1" onclick="openLayerDocuments(${dbId})">
                                    <img src="${documentSVG}" width="40px" alt="">
                                    <br>
                                    <small>اسناد</small>
                                </div>
                                <div onclick="enablePolygonEditFromClick()" class="pointerCursor p-1 border border-secondary rounded m-1">
                                    <img src="${editPolygonSVG}" width="40px" alt=""><br>
                                    <small>ویرایش</small>
                                </div>
                            </div>
                            <div class="text-center mt-2">
                                <small>مساحت: ${newArea} متر مربع</small>
                            </div>
                        </div>`;

                        const popupLatLng = L.latLng(center.lat + 0.0001, center.lng);
                        L.popup()
                            .setLatLng(popupLatLng)
                            .setContent(toolContent)
                            .openOn(map);
                    });


                    marker.on('click', function () {
                        map.flyToBounds(bounds, {
                            padding: [200, 200],
                            duration: 3
                        }).once('zoomend', function () {
                            const currentZoom = map.getZoom();
                            if (currentZoom > 15) {
                                const popupLatLng = L.latLng(center.lat + 0.0001, center.lng);
                                L.popup()
                                    .setLatLng(popupLatLng)
                                    .setContent(`
                                        <img src="${imageLink}" class="rounded" alt="سردر" width="100%" style="max-height: 300px">
                                        <div class="tool-container text-right" dir="rtl">
                                            <h6>${name}</h6>
                                            <div class="tool-list justify-content-around text-center d-flex">
                                                <div onclick="openLayerComment(${dbId})" class="pointerCursor p-1 border border-secondary rounded m-1">
                                                    <img src="${downloadSVG}" width="40px" alt="">
                                                    <br>
                                                    <small>یادداشت</small>
                                                </div>
                                                <div class="pointerCursor p-1 border border-secondary rounded m-1" onclick="printLayerDetails(${dbId}, '${lat}', '${lng}')">
                                                    <img src="${detailSVG}" width="40px" alt="">
                                                    <br>
                                                    <small>جزئیات</small>
                                                </div>
                                                <div class="pointerCursor p-1 border border-secondary rounded m-1" onclick="openLayerDocuments(${dbId})">
                                                    <img src="${documentSVG}" width="40px" alt="">
                                                    <br>
                                                    <small>اسناد</small>
                                                </div>
                                            </div>
                                            <div class="text-center mt-2">
                                                <small>مساحت: ${newArea} متر مربع</small>
                                            </div>
                                        </div>`)
                                    .openOn(map);
                            }
                        });
                    });
                }
            }).addTo(markerGroup);
        });
    });
}

window.addEventListener('load', function () {
    addAllFeaturesIran();
});

function closeLayerDetail() {
    col3.classList.add('d-none');
    col3.classList.remove('expanded');
    col3.style.flexBasis = "0";
}

function printLayerDetails(index, lat, lng) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
        }
    }
    var name = properties.onvan
    var editing = properties['editingList']
    const col3 = document.getElementById('col3');
    col3.classList.remove('d-none');
    col3.classList.add('expanded');
    col3.style.flexBasis = "50%";
    col3.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'd-flex justify-content-between mb-3';
    const headerTitle = document.createElement('h5');
    headerTitle.innerText = 'جزییات ملک';
    headerDiv.appendChild(headerTitle);
    var item = `<a class="btn btn-sm btn-danger" onclick="closeLayerDetail()">بستن</a>`
    headerDiv.innerHTML += item
    col3.appendChild(headerDiv);
    const allTools = `<div class="d-flex justify-content-around mb-2 border border-secondary p-1 rounded text-center">
        <div class="pointerCursor dropdown">
        <a class="dropdown-toggle text-decoration-none text-black" id="downloadMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <img src="${downloadSVG}" width="40px" alt="">
        <br>
        <small>دانلود</small>
        </a>
        <div class="dropdown-menu text-right" aria-labelledby="downloadMenu">
        <a class="dropdown-item" onclick="downloadToExcel(${index}, '${name}')">excel</a>
        <a class="dropdown-item" onclick="downloadToKML1(${index}, '${name}')">kml</a>
        <a class="dropdown-item" onclick="exportGeoJSONToVerticalPDF(${index}, '${name}')">pdf</a>
        <a class="dropdown-item" onclick="exportGeoJSONToExcelLat(${index})">utm</a>
        </div>
        </div>
        <div class="pointerCursor" onclick="zoomToLayer(${lat}, ${lng})">
        <img src="${zoomSVG}" width="40px" alt="">
        <br>
        <small>بزرگنمایی</small>
        </div>
        <div class="pointerCursor" onclick="getReports(${index})">
        <img src="${logSVG}" width="40px" alt="">
        <br>
        <small>سوابق ویرایش</small>
        </div>
        <div class="pointerCursor" onclick="openLayerDocuments(${index})">
        <img src="${documentSVG}" width="40px" alt="">
        <br>
        <small>اسناد</small>
        </div>
        <div class="pointerCursor" onclick="printFeature(${index}, '${name}')">
        <img src="${printerSVG}" width="40px" alt="">
        <br>
        <small>چاپ</small>
        </div>
        <div class="pointerCursor" onclick="findFeature(${index})">
        <img src="${findMap}" width="40px" alt="">
        <br>
        <small>محدوده</small>
        </div>
        </div>`;
    col3.innerHTML += `<div id='pdfContent'>`;
    col3.innerHTML += allTools;
    var tableTitle = `<h5 class="mt-2">${properties['onvan']}</h5>`
    col3.innerHTML += tableTitle
    let tableContent = '<div class="rounded p-1" id="attTable" style="height: 450px; overflow: auto;"><table class="table table-bordered table-striped"><thead><tr><th>ویرایش</th><th>عنوان</th><th>مقدار</th></tr></thead><tbody>';
    const keysOrder = Object.keys(persianName);
    keysOrder.forEach(key => {
        if (properties.hasOwnProperty(key)) {
            var newKey = persianName[key];
            var value = properties[key];
            if (key === 'arse' || key === 'aeian') {
                value = Number.parseInt(value).toLocaleString('en-US') + ' متر مربع';
            }
            if (newKey !== undefined && newKey !== 'مستندات' && newKey !== "لینک سردر") {
                if (editing.includes(key)) {
                    tableContent += `<tr><td onclick="editTableRowError('${key}', ${index})" class="text-center"><img class="pointerCursor" src="${editSVGRed}" width="20px" alt=""></td><td>${newKey}</td><td>${value}</td></tr>`;
                } else {
                    tableContent += `<tr><td onclick="editTableRow('${key}', ${index})" class="text-center"><img class="pointerCursor" src="${editSVG}" width="20px" alt=""></td><td>${newKey}</td><td>${value}</td></tr>`;
                }
            }
        }
    });
    tableContent += '</tbody></table></div>';
    col3.innerHTML += tableContent;
    col3.innerHTML += `</div>`;
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function () {
        });
    });
}

var selectedGeoFromUploadDocument = 0;

function openLayerDocuments(index) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
        }
    }
    var dbId = properties['dbId']
    showLoadingAlert("در حال بارگزاری اسناد")
    setTimeout(function () {
        $.ajax({
            url: '/get-geo-doc',
            type: 'post',
            data: {
                'dbId': dbId,
            },
            success: function (data) {
                selectedGeoFromUploadDocument = dbId;
                Swal.close()
                const modal = new bootstrap.Modal(document.getElementById('searchDocumentsModal'));
                modal.show();
                var searchDocumentTableBody = document.getElementById('searchDocumentTableBody')
                searchDocumentTableBody.innerHTML = ''
                for (var a in data.documents) {
                    var doc = data.documents[a];
                    var item = `<tr>
                                <th scope="row">${doc.id}</th>
                                <td>${doc.fileName}</td>
                                <td>${doc.vahedName}</td>
                                <td>${doc.onvanName}</td>
                                <td>${doc.uploadedBy}</td>
                                <td>${doc.uploadedDate}</td>
                                <td><a onclick="openDocumentDetail(${doc.id})" class="material-symbols-outlined">
                                    visibility
                                </a></td>
                            </tr>`;
                    searchDocumentTableBody.innerHTML += item;
                }
            },
            error: function () {
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            },
            failure: function (data) {
                Swal.close()
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }, 500);
}

function uploadDocument() {
    showLoadingAlert("در حال بارگزاری اطلاعات")
    var formData = new FormData();
    formData.append('dbId', selectedGeoFromUploadDocument);
    formData.append('title', $('#fileTitle').val());
    formData.append('file', $('#fileInput')[0].files[0]);
    if (!$('#fileTitle').val() || $('#fileTitle').val().trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'خطا',
            text: 'لطفاً عنوان فایل را وارد کنید.',
            confirmButtonText: 'باشه'
        });
        return;
    }

    if (!$('#fileInput')[0].files[0]) {
        Swal.fire({
            icon: 'warning',
            title: 'خطا',
            text: 'لطفاً یک فایل انتخاب کنید.',
            confirmButtonText: 'باشه'
        });
        return;
    }
    setTimeout(function () {
        $.ajax({
            url: '/upload-document',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                if (data.check) {
                    Swal.close();
                    document.getElementById('closeUploadDocument').click()
                    var searchDocumentTableBody = document.getElementById('searchDocumentTableBody');
                    searchDocumentTableBody.innerHTML = '';
                    var item = `<tr>
                                    <th scope="row">${data.docId}</th>
                                    <td>${data.fileName}</td>
                                    <td>${data.vahedName}</td>
                                    <td>${data.onvanName}</td>
                                    <td>${data.uploadedBy}</td>
                                    <td>الان</td>
                                    <td><a onclick="openDocumentDetail(${data.docId})" class="material-symbols-outlined">
                                        visibility
                                    </a></td>
                                </tr>`;
                    searchDocumentTableBody.innerHTML += item;
                    showTimerGreenAlert("سند جدید بارگزاری شد", 2000)
                } else {
                    showTimerRedAlert('بار گزاری سند با خطا همراه بود')
                }
            },
            error: function () {
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            },
            failure: function () {
                Swal.close();
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }, 100);

}

function downloadToKML1(index, name) {
    let feature;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            feature = allData.features[i]
        }
    }

    if (feature.geometry.type !== "Polygon") {
        return;
    }
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>${feature.properties.name || "Polygon"}</name>
              <Polygon>
                <outerBoundaryIs>
                  <LinearRing>
                    <coordinates>
                      ${feature.geometry.coordinates[0].map(coord => coord.join(",")).join(" ")}
                    </coordinates>
                  </LinearRing>
                </outerBoundaryIs>
              </Polygon>
            </Placemark>
          </Document>
        </kml>`;

    const a = document.createElement("a");
    const file = new Blob([kml], {type: "application/vnd.google-earth.kml+xml"});
    a.href = URL.createObjectURL(file);
    a.download = "output.kml".replace('output', name);
    a.click();
}

var editingCommentId = 0;

function openLayerComment(index) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
        }
    }
    editingCommentId = properties['dbId']
    const modal = new bootstrap.Modal(document.getElementById('CommentModal'));
    modal.show();
    var modalBody = document.getElementById('commentModalBody')
    var ownerModalBody = document.getElementById('OwnerCommentModalBody')
    ownerModalBody.innerHTML = ''
    modalBody.innerHTML = ''
    var modalFooter = document.getElementById('commentModalFooter')
    var ownerModalFooter = document.getElementById('ownerCommentModalFooter')
    ownerModalFooter.innerHTML = ''
    modalFooter.innerHTML = ''

    var commentText = properties['comment']
    var textArea = document.createElement('textarea')
    textArea.className = 'form-control'
    textArea.innerText = commentText
    modalBody.appendChild(textArea)

    var editButton = document.createElement('button')
    editButton.className = 'btn btn-success mt-1'
    editButton.innerText = 'ویرایش'
    editButton.onclick = function () {
        var newCommentText = textArea.value
        showLoadingAlert("در حال ثبت یادداشت")
        setTimeout(function () {
            $.ajax({
                url: '/edit-comment',
                type: 'post',
                data: {
                    'dbId': index,
                    'comment': newCommentText
                },
                success: function (data) {
                    Swal.close()
                    if (data['check']) {
                        modal.hide()
                        for (var i = 0; i < allData.features.length; i++) {
                            if (allData.features[i].properties['dbId'] === index) {
                                allData.features[i].properties['comment'] = newCommentText
                            }
                        }
                        showTimerGreenAlert('یادداشت ویرایش شد', 2000)
                    } else {
                        showTimerRedAlert("ویرایش یادداشت با خطا همراه بود", 2000)
                    }
                },
                error: function () {
                    Swal.fire({
                        position: "top-end",
                        icon: "warning",
                        title: "خطای سرور رخ داد",
                        showConfirmButton: false,
                        timer: 1500
                    });
                },
                failure: function (data) {
                    Swal.close()
                    Swal.fire({
                        position: "top-end",
                        icon: "warning",
                        title: "خطای سرور رخ داد",
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            });
        }, 5000);
    }
    modalFooter.appendChild(editButton)

    var ownerCommentText = properties['ownerComment']
    var ownerTextArea = document.createElement('textarea')
    ownerTextArea.className = 'form-control'
    ownerTextArea.innerText = ownerCommentText
    ownerModalBody.appendChild(ownerTextArea)

    var ownerEditButton = document.createElement('button')
    ownerEditButton.className = 'btn btn-success mt-1'
    ownerEditButton.innerText = 'ویرایش'
    ownerEditButton.onclick = function () {
        var ownerNewCommentText = ownerTextArea.value
        showLoadingAlert("در حال ثبت یادداشت")
        setTimeout(function () {
            $.ajax({
                url: '/owner-edit-comment',
                type: 'post',
                data: {
                    'dbId': index,
                    'comment': ownerNewCommentText
                },
                success: function (data) {
                    Swal.close()
                    if (data['check']) {
                        modal.hide()
                        for (var i = 0; i < allData.features.length; i++) {
                            if (allData.features[i].properties['dbId'] === index) {
                                allData.features[i].properties['ownerComment'] = ownerNewCommentText
                            }
                        }
                        showTimerGreenAlert('یادداشت ویرایش شد', 2000)
                    } else {
                        showTimerRedAlert("ویرایش یادداشت با خطا همراه بود", 2000)
                    }
                },
            });
        }, 5000);
    }
    ownerModalFooter.appendChild(ownerEditButton)
}

function openDocumentDetail(docId) {
    showLoadingAlert("در حال بارگزاری سند")
    setTimeout(function () {
        setTimeout(function () {
                $.ajax({
                    url: '/get-doc-detail',
                    type: 'post',
                    data: {
                        'dbId': docId,
                    },
                    success: function (data) {
                        Swal.close()
                        const modal = new bootstrap.Modal(document.getElementById('documentsDetailModal'));
                        modal.show();
                        var documentDetailHeader = document.getElementById('documentDetailHeader')
                        documentDetailHeader.innerHTML = '';
                        var documentDetailBody = document.getElementById('documentDetailBody')
                        var detail = data.document;
                        var header = `<h4>${detail.docName}</h4>
                            <div class="d-flex justify-content-between align-items-center">
                                <span>عنوان: ${detail.onvanName}</span>
                                <span>واحد: ${detail.vahedName}</span>
                                <span>آپلود کننده: ${detail.uploadedBy}</span>
                                <span>تاریخ آپلود: ${detail.uploadedDate}</span>
                            </div>`;
                        documentDetailHeader.innerHTML += header
                        const contentDiv = document.getElementById('documentDetailBody');
                        contentDiv.innerHTML = '';
                        var url = detail.downloadUrl;
                        document.getElementById('downloadDcoumentId').addEventListener('click', function (e) {
                            e.preventDefault();
                            window.open(url, '_blank');
                        });

                        const fileExtension = url.split('.').pop().toLowerCase();
                        if (fileExtension === 'jpg' || fileExtension === 'jpeg' ||
                            fileExtension === 'png' || fileExtension === 'gif') {
                            const img = document.createElement('img');
                            img.src = url;
                            img.className = 'rounded'
                            img.alt = "Image";
                            img.style.maxWidth = "100%";
                            contentDiv.appendChild(img);
                        } else if (fileExtension === 'pdf') {
                            const iframe = document.createElement('iframe');
                            iframe.src = url;
                            iframe.style.width = "100%";
                            iframe.style.height = "600px";
                            iframe.style.border = "none";
                            contentDiv.appendChild(iframe);
                        } else {
                            contentDiv.textContent = "فرمت فایل پشتیبانی نمی‌شود.";
                        }
                    },
                    error: function () {
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    },
                    failure: function (data) {
                        Swal.close()
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                });
            },
            100
        )
    }, 500);
}

function zoomToLayer(lat, lng) {
    map.flyTo([lat, lng], 18, {
        duration: 3
    });
}

function editTableRowError(key, index) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
        }
    }
    var dbId = properties.dbId
    let timerInterval;
    Swal.fire({
        title: "این ردیف در انتظار تایید ادمین می باشد",
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "تایید",
        denyButtonText: `لغو دخواست`
    }).then((result) => {
        if (result.isDenied) {
            Swal.fire({
                title: "در حال پردازش اطلاعات",
                didOpen: () => {
                    Swal.showLoading();
                },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            })
            setTimeout(function () {
                $.ajax({
                    url: '/cancel-changes',
                    type: 'post',
                    data: {
                        'dbId': dbId,
                        'key': key,
                    },
                    success: function (data) {
                        Swal.close()
                        if (data['check']) {
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "درخواست شما برای لغو ثبت تغییرات اعمال شد",
                                showConfirmButton: false,
                                timer: 3000
                            });
                        } else {
                            Swal.fire({
                                position: "top-end",
                                icon: "warning",
                                title: "ثبت درخواست شما با خطا همراه بود",
                                showConfirmButton: false,
                                timer: 3000
                            });
                        }
                    },
                    error: function () {
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    },
                    failure: function (data) {
                        Swal.close()
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                });
            }, 100)

        }
    });
}

function editTableRow(key, layerIndex) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === layerIndex) {
            properties = allData.features[i].properties
        }
    }
    var newKey = persianName[key]
    var oldName = properties[key]
    var dbId = properties.dbId
    Swal.fire({
        title: ":ویرایش مقدار 0".replace('0', newKey),
        text: 'مقدار جدید را وارد کنید',
        input: "text",
        cancelButtonText: 'لغو',
        inputValue: oldName,
        inputClass: 'rtl-input',
        inputAttributes: {
            autocapitalize: "off",
            id: "newValueId"
        },
        showCancelButton: true,
        confirmButtonText: "اعمال ویرایش",
        showLoaderOnConfirm: true,
        preConfirm: async (login) => {
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            let timerInterval;
            Swal.fire({
                title: "در حال پردازش اطلاعات",
                didOpen: () => {
                    Swal.showLoading();
                },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            })
            setTimeout(function () {
                var persianKey = persianName[key]
                $.ajax({
                    url: '/change-properties',
                    type: 'post',
                    data: {
                        'layerIndex': layerIndex,
                        'key': key,
                        'persianKey': persianKey,
                        'dbId': dbId,
                        'oldName': oldName,
                        'newValue': result.value,
                    },
                    success: function (data) {
                        Swal.close()
                        if (data.check && !data.exist) {
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "تغییرات برای ادمین ارسال شد. در صورت تایید در سامانه اعمال می گردد",
                                showConfirmButton: false,
                                timer: 3000
                            });
                        } else {
                            Swal.fire({
                                position: "top-end",
                                icon: "warning",
                                title: "این ردیف قبلا ویرایش شده و در انتظار تایید ادمین می باشد",
                                showConfirmButton: false,
                                timer: 3000
                            });
                        }
                    },
                    error: function () {
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    },
                    failure: function (data) {
                        Swal.close()
                        Swal.fire({
                            position: "top-end",
                            icon: "warning",
                            title: "خطای سرور رخ داد",
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                });
            }, 100)
        }
    });
}

function getReports(index) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
        }
    }
    reportModal.show()
    var dbId = properties.dbId;
    reportIndex = dbId;
    Swal.fire({
        title: "در حال پردازش اطلاعات",
        didOpen: () => {
            Swal.showLoading();
        },
    })

    setTimeout(function () {
        $.ajax({
            url: '/get-feature-report',
            type: 'post',
            data: {
                'index': dbId,
            },
            success: function (data) {
                Swal.close()
                if (data.check) {
                    const tableBody = document.getElementById('tableBody');
                    tableBody.innerHTML = '';
                    index = 0;
                    data.changes.forEach(item => {
                        index++;
                        const row = document.createElement('tr');
                        const rowNumber = document.createElement('td');
                        const cellUsername = document.createElement('td');
                        const cellKey = document.createElement('td');
                        const cellOldValue = document.createElement('td');
                        const cellNewValue = document.createElement('td');
                        const cellDate = document.createElement('td');

                        cellUsername.textContent = item.username;
                        rowNumber.textContent = index;
                        cellKey.textContent = persianName[item.key];
                        cellOldValue.textContent = item.old_value;
                        cellNewValue.textContent = item.new_value;
                        cellDate.textContent = item.date;

                        row.appendChild(rowNumber);
                        row.appendChild(cellUsername);
                        row.appendChild(cellKey);
                        row.appendChild(cellOldValue);
                        row.appendChild(cellNewValue);
                        row.appendChild(cellDate);
                        tableBody.appendChild(row);
                    });
                } else {
                    Swal.fire({
                        position: "top-end",
                        icon: "warning",
                        title: "خطای سرور رخ داد",
                        showConfirmButton: false,
                        timer: 3000
                    });
                }
            },
            error: function (e) {
                Swal.close()
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            },
            failure: function (data) {
                Swal.close()
                Swal.fire({
                    position: "top-end",
                    icon: "warning",
                    title: "خطای سرور رخ داد",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }, 100)
}

function updateCornerCoordinates(map) {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const nw = L.latLng(ne.lat, sw.lng);
    const se = L.latLng(sw.lat, ne.lng);

    document.getElementById('coord-nw').innerText = `NW\n${nw.lat.toFixed(5)}, ${nw.lng.toFixed(5)}`;
    document.getElementById('coord-ne').innerText = `NE\n${ne.lat.toFixed(5)}, ${ne.lng.toFixed(5)}`;
    document.getElementById('coord-sw').innerText = `SW\n${sw.lat.toFixed(5)}, ${sw.lng.toFixed(5)}`;
    document.getElementById('coord-se').innerText = `SE\n${se.lat.toFixed(5)}, ${se.lng.toFixed(5)}`;
}

let layersControl;

function printFeature(index, title) {
    let properties;
    let feature;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            properties = allData.features[i].properties
            feature = allData.features[i]
        }
    }
    var mainSearchDiv = document.getElementById('searchDataPrintDiv')
    mainSearchDiv.innerHTML = `<label for="search">افزودن اطلاعات توصیفی</label>
                            <input type="text" id="search" class="form-control" onkeyup="filterList('${index}')"
                                                               placeholder="جستجو...">
                            <div class="dropdown-menu" id="dropdown"></div>`
    const modalElement = document.getElementById('printModal');
    printModal.show();
    window.prinMap = L.map('printMap').setView(map.getCenter(), map.getZoom());
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(window.prinMap);

    L.geoJSON(feature, {
        renderer: L.canvas({padding: 0.5}),
        style: {
            color: '#ff0000',
            weight: 2,
            fillOpacity: 0.3
        }
    }).addTo(window.prinMap);


    modalElement.addEventListener('hidden.bs.modal', function () {
        if (window.prinMap) {
            window.prinMap.remove();
            delete window.prinMap;
        }
    });

    layersControl = L.control.layers(baseMaps, null, {position: 'topleft'}).addTo(window.prinMap);

    document.getElementById('printMapTitleInput').addEventListener('input', function (event) {
        var inputValue = event.target.value;
        var printMapTitle = document.getElementById('printMapTitle');
        printMapTitle.innerText = inputValue;
        if (inputValue === '') {
            printMapTitle.innerText = title;
        }
    });

    window.prinMap.on('zoomend', getMapScale);
    window.prinMap.on('moveend', getMapScale);

    document.getElementById('printMapDescriptionInput').addEventListener('input', function (event) {
        var inputValue = event.target.value;
        var printMapSpan = document.getElementById('printMapSpan');

        if (inputValue === '') {
            printMapSpan.innerText = 'توضیحات نقشه';
        } else {
            printMapSpan.innerText = inputValue;
        }
    });

    document.getElementById('titleDiv').innerHTML = `<div class="p-1 bg-secondary rounded">
                <div class="d-flex">
                    <div class="bg-danger border border-danger rounded mt-1" style="width: 20px; height: 15px; margin-left: 3px"></div>
                    <span class="text-white">${properties.onvan || 'نام مشخص نشده'}</span>
                </div>
            </div>`
    updateCornerCoordinates(window.prinMap);
    window.prinMap.on('moveend zoomend', function () {
        updateCornerCoordinates(window.prinMap);
    });
    document.getElementById('printMapTitle').value = title;

}

async function findFeature(index) {
    var myOffcanvas = document.getElementById('closeLayerButton');
    myOffcanvas.click()
    let feature;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === index) {
            feature = allData.features[i];
            break;
        }
    }
    if (!feature) {
        Swal.fire("خطا", "ویژگی مورد نظر پیدا نشد.", "error");
        return;
    }
    const {value: radius} = await Swal.fire({
        title: "شعاع جستجو را وارد کنید",
        input: "number",
        inputLabel: "شعاع بر حسب کیلومتر",
        inputPlaceholder: "مثلاً 2",
        showCancelButton: true,
        confirmButtonText: "جستجو",
        cancelButtonText: "لغو",
        inputValidator: (value) => {
            if (!value || value <= 0) {
                return "لطفاً یک شعاع معتبر وارد کنید";
            }
        }
    });
    if (!radius) return;
    searchNearbyFeatures(feature, parseFloat(radius));
}

function searchNearbyFeatures(centerFeature, radius) {
    const centerCoords = turf.center(centerFeature).geometry.coordinates;
    const centerPoint = turf.point(centerCoords);
    const foundFeatures = [];
    for (let i = 0; i < allGeometry.features.length; i++) {
        const targetFeature = allGeometry.features[i];
        const targetCenter = turf.center(targetFeature).geometry.coordinates;
        const targetPoint = turf.point(targetCenter);
        const distance = turf.distance(centerPoint, targetPoint, {units: 'kilometers'});
        if (distance <= radius) {
            foundFeatures.push(targetFeature);
        }
    }
    Swal.fire({
        title: "نتیجه جستجو",
        text: `تعداد ${foundFeatures.length} ویژگی در شعاع ${radius} کیلومتر یافت شد.`,
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: 'بستن',
        confirmButtonText: "نمایش در نقشه"
    }).then((result) => {
        if (result.isConfirmed) {
            addGroupLayerWithFeatures(foundFeatures, true, 'جستجوی محدوده')
        }
    });
}

function printMapToPDF() {
    leafletImage(window.prinMap, function (err, mapCanvas) {
        if (err) {
            alert("خطا در گرفتن عکس نقشه");
            return;
        }

        const printMapDiv = document.getElementById('printMap');
        const mainDiv = document.getElementById('mainMapPrintDiv');

        printMapDiv.style.visibility = 'hidden';

        html2canvas(mainDiv, {useCORS: true, scale: 3}).then(function (htmlCanvas) {
            const ctx = htmlCanvas.getContext('2d');

            const mainRect = mainDiv.getBoundingClientRect();
            const mapRect = printMapDiv.getBoundingClientRect();

            const x = mapRect.left - mainRect.left;
            const y = mapRect.top - mainRect.top;
            const width = mapRect.width;
            const height = mapRect.height;

            ctx.drawImage(mapCanvas, x * 3, y * 3, width * 3, height * 3);

            printMapDiv.style.visibility = 'visible';

            const finalDataUrl = htmlCanvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [htmlCanvas.width, htmlCanvas.height],
            });

            pdf.addImage(finalDataUrl, 'PNG', 0, 0, htmlCanvas.width, htmlCanvas.height);

            pdf.save('map_with_details.pdf');
        });
    });
}

function getMapScale() {
    const zoomLevel = window.prinMap.getZoom();
    const center = window.prinMap.getCenter();
    const scaleInMeters = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoomLevel);
    const scaleInCentimeters = scaleInMeters * 100;
    document.getElementById('mapPrintZoom').innerText = `${scaleInCentimeters.toFixed(2)} / 1`;
}

async function printMapToPNG() {
    showLoadingAlert("در حال دریافت خروجی");
    window.prinMap.zoomControl.remove();
    if (layersControl) {
        layersControl.remove();
    }
    const element = document.getElementById('mainMapPrintDiv');
    const canvas = await html2canvas(element, {useCORS: true, scale: 3});
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'map.png';
    link.click();
    Swal.close()
}

const list = Object.values(persianName);

function filterList(index) {
    let properties;
    for (var i = 0; i < allData.features.length; i++) {
        if (allData.features[i].properties['dbId'] === parseInt(index)) {
            properties = allData.features[i].properties
        }
    }
    var selectedKeyDiv = document.getElementById('selectedKey')
    const input = document.getElementById("search");
    const filter = input.value.toLowerCase();
    const dropdown = document.getElementById("dropdown");
    dropdown.innerHTML = "";

    if (filter.length === 0) {
        dropdown.classList.remove("show");
        return;
    }

    const filteredItems = list.filter(item => item.toLowerCase().includes(filter));
    if (filteredItems.length === 0) {
        dropdown.classList.remove("show");
        return;
    }

    filteredItems.forEach(item => {
        const div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerHTML = `<div class="text-right"><span class='text-black'>${item}</span></div>`;
        div.onclick = function () {
            function findKeyByValue(obj, value) {
                return Object.keys(obj).find(key => obj[key] === value);
            }

            const key = findKeyByValue(persianName, item);
            var newValue = properties[key]
            var newMapDetail = document.getElementById('newMapDetail')
            var newDetail = document.createElement('span')
            newDetail.id = key
            newDetail.innerText = item + ':' + newValue
            newMapDetail.appendChild(newDetail)
            newMapDetail.appendChild(document.createElement('br'))

            input.value = item;
            dropdown.classList.remove("show");
            var selectedDiv = document.createElement('div')
            selectedDiv.onclick = function () {
                var deleteElement = document.getElementById(key + '_')
                newMapDetail.removeChild(newDetail)
                selectedKeyDiv.removeChild(deleteElement)
            }
            selectedDiv.className = 'p-1 bg-warning-subtle rounded'
            selectedDiv.style.marginTop = "35px"
            selectedDiv.style.marginRight = "3px"
            selectedDiv.style.cursor = "pointer"
            selectedDiv.style.marginLeft = "5px"
            selectedDiv.style.height = "35px"
            selectedDiv.id = key + '_'
            selectedDiv.innerText = item
            selectedKeyDiv.appendChild(selectedDiv)
        }
        dropdown.appendChild(div);
    });

    dropdown.classList.add("show");
    checkAndToggleBorder();
}

// ------------------------- classify -----------------
document.addEventListener('DOMContentLoaded', function () {
    const categoryRangesDiv = document.getElementById('categoryRanges');
    const classifyButton = document.getElementById('classifyButton');
    const classificationResultsDiv = document.getElementById('classificationResults');
    const chartBtn = document.getElementById('showChartButton');
    const chartCanvas = document.getElementById('classificationChart');

    // دکمه خروجی عکس نمودار
    const exportImageBtn = document.createElement('button');
    exportImageBtn.textContent = 'خروجی عکس نمودار';
    exportImageBtn.className = 'btn btn-primary mt-2';
    chartCanvas.parentNode.insertBefore(exportImageBtn, chartCanvas.nextSibling);
    exportImageBtn.style.display = 'none'; // اول مخفی

    let chartInstance = null;
    let lastCategories = {};
    let lastRanges = [];  // اضافه شد: آرایه بازه‌ها رو ذخیره می‌کنیم

    categoryRangesDiv.addEventListener('click', function (event) {
        if (event.target.classList.contains('add-range')) {
            const newRangeDiv = document.createElement('div');
            newRangeDiv.classList.add('input-group', 'mb-2');
            newRangeDiv.innerHTML = `
                <input type="number" class="form-control" placeholder="از">
                <div class="input-group-prepend mx-1">
                    <span class="input-group-text">تا</span>
                </div>
                <input type="number" class="form-control" placeholder="تا">
                <div class="input-group-append">
                    <button class="btn btn-danger remove-range" type="button">-</button>
                </div>`;
            categoryRangesDiv.appendChild(newRangeDiv);
        } else if (event.target.classList.contains('remove-range')) {
            event.target.parentNode.parentNode.remove();
        }
    });

    classifyButton.addEventListener('click', function () {
        var geojsonData = selectedGeometryForClassify; // داده GeoJSON شما
        const classifyFieldSelect = document.getElementById('classifyField');
        const selectedField = classifyFieldSelect.value;
        const selectedText = classifyFieldSelect.options[classifyFieldSelect.selectedIndex].text;

        if (!geojsonData || geojsonData.length === 0) {
            classificationResultsDiv.textContent = 'هیچ داده GeoJSON بارگیری نشده است.';
            return;
        }

        const ranges = [];
        const rangeInputs = categoryRangesDiv.querySelectorAll('.input-group');
        rangeInputs.forEach(rangeInput => {
            const fromInput = rangeInput.querySelector('input:nth-child(1)');
            const toInput = rangeInput.querySelector('input:nth-child(3)');
            const from = parseFloat(fromInput.value);
            const to = parseFloat(toInput.value);
            if (!isNaN(from) && !isNaN(to)) {
                ranges.push({from, to, name: `${from} تا ${to}`});
            }
        });

        lastRanges = ranges;  // ذخیره آرایه بازه‌ها برای رسم نمودار

        const categories = {};
        geojsonData.forEach(feature => {
            const propertyValue = feature.properties[selectedField];
            if (propertyValue !== undefined) {
                let categorized = false;
                ranges.forEach(range => {
                    if (propertyValue >= range.from && propertyValue <= range.to) {
                        if (!categories[range.name]) {
                            categories[range.name] = 0;
                        }
                        categories[range.name]++;
                        categorized = true;
                    }
                });
                if (!categorized) {
                    const otherCategoryName = 'سایر';
                    if (!categories[otherCategoryName]) {
                        categories[otherCategoryName] = 0;
                    }
                    categories[otherCategoryName]++;
                }
            }
        });

        lastCategories = categories;

        classificationResultsDiv.innerHTML = '<h5>نتایج دسته‌بندی برای فیلد "' + selectedText + '":</h5>';
        if (Object.keys(categories).length > 0) {
            const ul = document.createElement('ul');
            // نمایش دسته‌ها بر اساس آرایه ranges
            ranges.forEach(range => {
                const categoryName = range.name;
                if (categories[categoryName] !== undefined) {
                    const li = document.createElement('li');
                    li.className = 'mt-1';
                    li.innerHTML = `
                ${categoryName}: ${categories[categoryName]} ملک
                <button class="btn btn-sm btn-outline-info show-console-category" data-category="${categoryName}">
                    <span style="margin-left: 5px">نمایش در لایه ها</span><img class="show-console-category" data-category="${categoryName}" src="${viewSVG}" width="20PX">
                </button>`;
                    ul.appendChild(li);
                }
            });
            const otherCategoryName = 'سایر';
            if (categories[otherCategoryName] !== undefined) {
                const li = document.createElement('li');
                li.className = 'mt-1';
                li.innerHTML = `
            ${otherCategoryName}: ${categories[otherCategoryName]} ملک
            <button class="btn btn-sm btn-outline-info show-console-category" data-category="${otherCategoryName}">
                <span style="margin-left: 5px">نمایش در لایه ها</span><img class="show-console-category" data-category="${otherCategoryName}" src="${viewSVG}" width="20PX">
            </button>`;
                ul.appendChild(li);
            }

            classificationResultsDiv.appendChild(ul);
        } else {
            classificationResultsDiv.textContent = 'هیچ ملک در بازه‌های تعریف  شده یافت نشد.';
        }

        // فقط یکبار listener اضافه کنیم به جای هر بار
        classificationResultsDiv.onclick = function (event) {
            if (event.target.classList.contains('show-console-category')) {
                const categoryName = event.target.getAttribute('data-category');
                logCategoryGeoJSONToConsole(categoryName, selectedField, lastRanges, geojsonData);
            }
        };

        chartCanvas.style.display = 'none';
        exportImageBtn.style.display = 'none';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    chartBtn.addEventListener('click', function () {
        const labels = [];
        const data = [];

        // بر اساس lastRanges ترتیب رو حفظ می‌کنیم
        lastRanges.forEach(range => {
            const categoryName = range.name;
            if (lastCategories[categoryName] !== undefined) {
                labels.push(categoryName);
                data.push(lastCategories[categoryName]);
            }
        });

        // دسته "سایر" در آخر اگر وجود داشت
        if (lastCategories['سایر'] !== undefined) {
            labels.push('سایر');
            data.push(lastCategories['سایر']);
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'تعداد املاک',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    maxBarThickness: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {display: false},
                    beforeDraw: (chart) => {
                        const ctx = chart.ctx;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = 'white';  // پس زمینه سفید
                        ctx.fillRect(0, 0, chart.width, chart.height);
                        ctx.restore();
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {display: true, text: 'بازه‌ها'}
                    },
                    y: {
                        title: {display: true, text: 'تعداد املاک'}
                    }
                }
            }
        });

        Chart.defaults.font = {
            family: 'yekan',
            size: 14,
            weight: 'normal'
        };

        chartCanvas.style.display = 'block';
        exportImageBtn.style.display = 'inline-block';
    });

    exportImageBtn.addEventListener('click', function () {
        // یک canvas موقت می‌سازیم با ابعاد نمودار اصلی
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = chartCanvas.width;
        tempCanvas.height = chartCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // پس‌زمینه سفید می‌کشیم
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // تصویر نمودار اصلی رو روی canvas موقت می‌کشیم
        tempCtx.drawImage(chartCanvas, 0, 0);

        // لینک دانلود عکس از canvas موقت ایجاد می‌کنیم
        const link = document.createElement('a');
        link.download = 'chart-image.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });

});

function logCategoryGeoJSONToConsole(categoryName, selectedField, ranges, allFeatures) {
    let filteredFeatures = [];

    if (categoryName === 'سایر') {
        filteredFeatures = allFeatures.filter(feature => {
            const propertyValue = feature.properties[selectedField];
            return propertyValue === undefined || !ranges.some(range => propertyValue >= range.from && propertyValue <= range.to);
        });
    } else {
        const currentRange = ranges.find(range => range.name === categoryName);
        if (currentRange) {
            filteredFeatures = allFeatures.filter(feature => {
                const propertyValue = feature.properties[selectedField];
                return propertyValue !== undefined && propertyValue >= currentRange.from && propertyValue <= currentRange.to;
            });
        }
    }

    addGroupLayerWithFeatures(filteredFeatures, true, categoryName.replace('تا', '-'));
    showTimerGreenAlert("دسته انتخاب شده به بخش لایه ها اضافه شد", 2000);
}
