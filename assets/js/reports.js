var selectedCities = []
var selectedOwnerType = []

function initializeFilters() {
    const leftOffCanvas = document.getElementById("rightOffCanvas");
    const leftCanvasBody = document.getElementById("leftCanvasBody");
    //leftCanvasBody.innerHTML = '';
    const bsCanvas = bootstrap.Offcanvas.getInstance(leftOffCanvas) || new bootstrap.Offcanvas(leftOffCanvas);
    if (leftCanvasBody.innerHTML.trim() === "") {
        const leftCanvasHeader = document.getElementById('leftCanvasHeader');
        leftCanvasHeader.innerText = 'فیلترهای مالکیت';
        addFilter(leftCanvasBody, 'cityInput', 'cityDropdownList', 'selectedCities',
            'فیلتر استان‌ها',
            'نام استان را وارد کنید',
            'استان‌های انتخاب شده',
             provinceList.slice(),
            selectedCities,
        );

        var allSituationType = [...new Set(allData.features.map(feature => feature.properties.malekiat))];

        addFilter(
            leftCanvasBody, 'typeInput', 'typeDropdownList', 'selectedTypes',
            'فیلتر انواع مالکیت ها',
            'نوع مالکیت را وارد کنید',
            'مالکیت های انتخاب شده',
            allSituationType.slice(),
            selectedOwnerType
        );
        var applyButtonDiv = document.createElement("div");
        applyButtonDiv.className = 'position-absolute bottom-0 start-0 w-100 text-center';
        const applyButton = document.createElement("button");
        applyButton.className = "btn btn-primary w-75 mb-3";
        applyButton.textContent = "اعمال فیلترها";
        applyButton.onclick = filterType
        applyButtonDiv.appendChild(applyButton);
        leftCanvasBody.appendChild(applyButtonDiv);
    }
    bsCanvas.show();
}

function filterType() {
    if (selectedCities.length === 0) {
        Swal.fire({
            position: "top-end",
            icon: "warning",
            title: "هیچ استانی انتخاب نشده است",
            showConfirmButton: false,
            timer: 3000
        });
    } else if (selectedOwnerType.length === 0) {
        Swal.fire({
            position: "top-end",
            icon: "warning",
            title: "نوع مالکیت را مشخص کنید",
            showConfirmButton: false,
            timer: 3000
        });
    } else {
        var allFilteredOwnerData = []
        for (var i = 0; i < allData.features.length; i++) {
            var featureOwnerType = allData.features[i].properties.malekiat;
            var featureProvinceName = allData.features[i].properties.ostan;
            if (selectedCities.includes(featureProvinceName) && selectedOwnerType.includes(featureOwnerType)) {
                allFilteredOwnerData.push(allData.features[i])
            }
        }
        addGroupLayerWithFeatures(allFilteredOwnerData)
    }
}

// function addGroupLayerWithFeatures(geoJsonFeatures) {
//     const style = {
//         color: '#3388ff',
//         weight: 1.3,
//         opacity: 1,
//         fillColor: '#3388ff',
//         fillOpacity: 0.1
//     };
//
//     // ایجاد گروه لایه
//     const groupLayer = L.layerGroup();
//     const newGroupLayer = L.layerGroup();
//
//     geoJsonFeatures.forEach((feature) => {
//         // افزودن لایه GeoJSON به گروه
//         const layer = L.geoJSON(feature, {
//             style: style
//         });
//
//         const bounds = layer.getBounds();
//         const center = bounds.getCenter();
//
//         // ایجاد مارکر در مرکز پلی‌گون
//         const category = feature.properties.tmelk;
//         const icon = icons[category] || icons['default'];
//         const marker = L.marker(center, {icon: icon});
//
//         marker.on('click', function () {
//             map.flyTo(center, 17, {duration: 3});
//
//             const popupLatLng = L.latLng(center.lat + 0.0001, center.lng);
//             const toolContent = `
//                 <div class="tool-container text-right" dir="rtl">
//                     <h6>${feature.properties.onvan || 'بدون نام'}</h6>
//                     <div class="tool-list justify-content-around text-center d-flex">
//                         <div class="pointerCursor p-1 border border-secondary rounded m-1">
//                             <img src="${downloadSVG}" width="40px" alt="">
//                             <br>
//                             <small>دانلود</small>
//                         </div>
//                         <div class="pointerCursor p-1 border border-secondary rounded m-1" onclick="printLayerDetails(${feature.properties.dbId}, '${center.lat}', '${center.lng}')">
//                             <img src="${detailSVG}" width="40px" alt="">
//                             <br>
//                             <small>جزئیات</small>
//                         </div>
//                         <div class="pointerCursor p-1 border border-secondary rounded m-1">
//                             <img src="${documentSVG}" width="40px" alt="">
//                             <br>
//                             <small>اسناد</small>
//                         </div>
//                     </div>
//                 </div>`;
//             L.popup()
//                 .setLatLng(popupLatLng)
//                 .setContent(toolContent)
//                 .openOn(map);
//         });
//
//         newGroupLayer.addLayer(marker);
//         newGroupLayer.addLayer(layer);
//     });
//
//     groupLayer.addTo(map);
//     newGroupLayer.addTo(map);
// }

//ss970016822
function addFilter(container, inputId, dropdownId, selectedId, label, placeholder, selectedLabel, items, selectedEmptyList) {
    const filterDiv = createFilterTemplate(inputId, dropdownId, selectedId, label, placeholder, selectedLabel);
    container.appendChild(filterDiv);
    setupFilter(selectedEmptyList, inputId, dropdownId, selectedId, items);
}

function createFilterTemplate(inputId, dropdownId, selectedId, label, placeholder, selectedLabel) {
    const filterDiv = document.createElement('div');
    filterDiv.className = "container mb-4";
    filterDiv.innerHTML = `
        <label for="${inputId}" class="form-label">${label}</label>
        <input id="${inputId}" type="text" class="form-control" placeholder="${placeholder}">
        <ul id="${dropdownId}" class="dropdown-menu text-black text-black w-75 mt-1"></ul>
        <div class="mt-3">
            <h6>${selectedLabel}</h6>
            <div id="${selectedId}" class="d-flex flex-wrap gap-2"></div>
        </div>`;
    return filterDiv;
}

function setupFilter(emptyList, inputId, dropdownId, selectedId, items) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const selectedList = document.getElementById(selectedId);

    input.addEventListener("click", () => {
        showDropdown(emptyList, items, dropdown, input, selectedList);
    });

    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        showDropdown(emptyList, items, dropdown, input, selectedList, query);
    });
}

function showDropdown(emptyList, items, dropdown, input, selectedList, query = "") {
    dropdown.innerHTML = "";

    const filteredItems = query === "" ? items : items.filter(item => item.toLowerCase().includes(query));

    if (filteredItems.length > 0) {
        dropdown.classList.add("show");
        filteredItems.forEach(item => {
            const listItem = document.createElement("li");
            listItem.className = "dropdown-item text-black text-right";
            listItem.textContent = item;
            listItem.addEventListener("click", () => {
                selectItem(emptyList, item, items, selectedList, dropdown, input);
            });
            dropdown.appendChild(listItem);
        });
    } else {
        dropdown.classList.remove("show");
    }
}

function selectItem(emptyList, item, items, selectedList, dropdown, input) {
    const selectedItem = document.createElement("div");
    selectedItem.className = "rounded border border-warning p-1 d-flex align-items-center gap-2";
    selectedItem.innerHTML = `
        <span>${item}</span>
        <span style="cursor: pointer;">&times;</span>`;

    selectedItem.querySelector('span:last-child').addEventListener("click", () => {
        selectedList.removeChild(selectedItem);
        items.push(item);
        const index = emptyList.findIndex(data => data === item);
        if (index !== -1) {
            emptyList.splice(index, 1);
        }
    });
    emptyList.push(item)
    selectedList.appendChild(selectedItem);
    items.splice(items.indexOf(item), 1);
    input.value = "";
    dropdown.innerHTML = "";
    dropdown.classList.remove("show");
}