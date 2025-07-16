import datetime
import json
import os
import urllib
from io import BytesIO
from django.contrib.auth.decorators import login_required
import requests
from PIL import Image
from django.contrib.gis.geos import GEOSGeometry
from django.core.files.base import ContentFile
from django.db.models import Prefetch
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from persiantools.jdatetime import JalaliDate
from admin_.models import GeoData, Changes, Log, IranData, TemporaryChart, Documents, BookmarkGeo, MainBookmark, \
    UserComments, MainGeoData
import filetype


@login_required(login_url='/login')
def get_doc_data(request):
    url = "http://185.231.183.46/listss"
    response = requests.get(url)
    response.raise_for_status()
    json_data = response.json()
    geo_data = GeoData.objects.all()
    for file in json_data['documents'][0:100]:
        title = file['title'].replace('.jpg', '').replace('.pdf', '').split(' _ ')
        vahed = title[0]
        try:
            onvan = title[1]
        except:
            onvan = ''
        for geo in geo_data:
            geo_onvan = geo.property['onvan']
            geo_vahed = geo.property['vahed']
            if vahed in geo_vahed and onvan in geo_onvan:
                download_url = f'http://185.231.183.46/documents/{file["id"]}/download'
                response = requests.get(download_url)
                response.raise_for_status()
                kind = filetype.guess(response.content)
                extension = f'.{kind.extension}' if kind else ''
                filename = f'downloaded_file{extension}'
                new_document = Documents.objects.create(
                    name=file['description'].replace('<p>', '').replace('</p>', ''),
                    uploaded_by=request.user,
                    geo_data=geo,
                )
                new_document.file.save(filename, ContentFile(response.content))
                new_document.save()
    return JsonResponse(json_data)


@login_required(login_url='/login')
def main_map(request):
    # for data in GeoData.objects.all():
    #     main_geo = MainGeoData.objects.get(id=1)
    #     data.main_geo = main_geo
    #     data.save()
    # ----------------- upload jahad shape files
    # file_path = os.path.join(settings.BASE_DIR, 'jahad.geojson')
    # with open(file_path, 'r', encoding='utf-8') as f:
    #     data = json.load(f)
    # for feature in data['features']:
    #     geom = GEOSGeometry(json.dumps(feature['geometry']))
    #     properties = feature['properties']
    #     new = GeoData.objects.create(geom=geom, property=properties)
    #     new.property['dbId'] = new.id
    #     new.save()

    # ----------------------- upload iran shape file
    # file_path = os.path.join(settings.BASE_DIR, 'provinces.json')
    # with open(file_path, 'r', encoding='utf-8') as f:
    #     data = json.load(f)
    # for feature in data['features']:
    #     geom = GEOSGeometry(json.dumps(feature['geometry']))
    #     new = IranData.objects.create(geom=geom)

    province_list = []
    vahed_names = []
    update = Changes.objects.filter(approved=False)
    context = {
        'provinceList': province_list,
        'vahedNames': vahed_names,
        'update': update
    }
    return render(request, 'adminMap.html', context)


@login_required(login_url='/login')
def iran_geojson_api(request):
    iran_data = IranData.objects.only('id', 'geom', 'name')

    features = [{
        "type": "Feature",
        "geometry": json.loads(data.geom.geojson),
        "name": data.name
    } for data in iran_data]

    return JsonResponse({
        "type": "FeatureCollection",
        "features": features
    })


@login_required(login_url='/login')
def geojson_api(request):
    main_geo = MainGeoData.objects.only('id', 'name').first()
    if not main_geo:
        return JsonResponse({"type": "FeatureCollection", "features": []})

    changes = Changes.objects.filter(approved=False)
    comments = UserComments.objects.filter(user=request.user)

    changes_dict = {}
    for c in changes:
        changes_dict.setdefault(c.geo_data_id, []).append(c.key)

    comments_dict = {c.geo_id: c.text for c in comments}

    geodata = GeoData.objects.filter(main_geo=main_geo) \
        .select_related('main_geo') \
        .only('id', 'geom', 'image', 'comment', 'property', 'main_geo')

    features = []
    for data in geodata:
        props = data.property or {}
        props['editingList'] = changes_dict.get(data.id, [])
        props['sardar'] = f"http://185.213.164.61{data.image.url}" if data.image else ''
        props['comment'] = data.comment or ''
        props['mainName'] = data.main_geo.name if data.main_geo else ''
        props['mainGeoData'] = data.main_geo.id if data.main_geo else ''
        props['ownerComment'] = comments_dict.get(data.id, '')

        features.append({
            "type": "Feature",
            "geometry": json.loads(data.geom.geojson),
            "properties": props
        })

    return JsonResponse({
        "type": "FeatureCollection",
        "features": features
    })


@login_required(login_url='/login')
def bookmarks_api(request):
    # پیش‌بارگذاری bookmark و داده‌هاش
    bookmarks = MainBookmark.objects.filter(user=request.user).prefetch_related(
        Prefetch('bookmarkgeo_set', queryset=BookmarkGeo.objects.only('geom', 'property', 'image'))
    )

    result = []
    for book in bookmarks:
        features = []
        for data in book.bookmarkgeo_set.all():
            props = data.property or {}
            props['sardar'] = f"http://185.213.164.61{data.image.url}" if data.image else ''
            props['comment'] = props.get('comment', '')
            props['editingList'] = []

            features.append({
                "type": "Feature",
                "geometry": json.loads(data.geom.geojson),
                "properties": props
            })

        result.append({
            'name': book.name,
            "type": "FeatureCollection",
            "features": features
        })

    return JsonResponse(result, safe=False)


@login_required(login_url='/login')
@csrf_exempt
def change_properties(request):
    if request.user.is_authenticated:
        layerIndex = request.POST.get('dbId')
        oldName = request.POST.get('oldName')
        key = request.POST.get('key')
        persian_key = request.POST.get('persianKey')
        newValue = request.POST.get('newValue')
        geo_data = GeoData.objects.get(id=layerIndex)
        exist = Changes.objects.filter(geo_data=geo_data, key=key).exists()
        if exist:
            return JsonResponse({
                'check': True, 'exist': True
            })
        else:
            Changes.objects.create(user=request.user, key=key, geo_data=geo_data, old_value=oldName, new_value=newValue,
                                   persian_key=persian_key)
            Log.objects.create(name='ایجاد ویرایش اطلاعات', user=request.user)
            return JsonResponse({'check': True, 'exist': False})
    else:
        return JsonResponse({'check': False})


@login_required(login_url='/login')
@csrf_exempt
def delete_change(request):
    if request.user.is_authenticated:
        update_id = request.POST.get('updateId')
        update = Changes.objects.get(id=update_id)
        Log.objects.create(name='حذف ویرایش اطلاعات املاک', user=request.user,
                           text=f'ویرایش اطلاعات ملک {update.geo_data.property["onvan"]} در استان {update.geo_data.property["ostan"]}'
                                f' برای کلید {update.persian_key} از {update.old_value} به {update.new_value}')
        update.delete()
        return JsonResponse({'check': True})
    else:
        return JsonResponse({'check': False})


@login_required(login_url='/login')
@csrf_exempt
def approve_change(request):
    if request.user.is_authenticated:
        update_id = request.POST.get('updateId')
        update = Changes.objects.get(id=update_id)
        geo = update.geo_data
        geo.property[update.key] = update.new_value
        geo.save()
        Log.objects.create(name='تایید ویرایش اطلاعات املاک', user=request.user,
                           text=f'ویرایش اطلاعات ملک {geo.property["onvan"]} در استان {geo.property["ostan"]}'
                                f' برای کلید {update.persian_key} از {update.old_value} به {update.new_value}')
        update.approved = True
        update.save()
        return JsonResponse({'check': True})
    else:
        return JsonResponse({'check': False})


@login_required(login_url='/login')
@csrf_exempt
def get_feature_report(request):
    try:
        if request.user.is_authenticated:
            index = request.POST.get('index')
            geo_data = GeoData.objects.get(id=index)
            changes = Changes.objects.filter(geo_data=geo_data)
            changes_list = []
            for change in changes:
                item = {
                    'username': change.user.username,
                    'key': change.key,
                    'old_value': change.old_value,
                    'new_value': change.new_value,
                    'date': change.jDate_serializable,
                }
                changes_list.append(item)
            return JsonResponse({
                'check': True, 'changes': changes_list
            })
        else:
            return JsonResponse({'check': False})

    except Exception as e:
        return JsonResponse({
            'check': False,
        })


@login_required(login_url='/login')
@csrf_exempt
def get_feature_report(request):
    try:
        if request.user.is_authenticated:
            index = request.POST.get('index')
            geo_data = GeoData.objects.get(id=index)
            changes = Changes.objects.filter(geo_data=geo_data)
            changes_list = []
            for change in changes:
                item = {
                    'username': change.user.username,
                    'key': change.key,
                    'old_value': change.old_value,
                    'new_value': change.new_value,
                    'date': change.jDate_serializable,
                }
                changes_list.append(item)
            return JsonResponse({
                'check': True, 'changes': changes_list
            })
        else:
            return JsonResponse({'check': False})

    except Exception as e:
        print(e)
        return JsonResponse({
            'check': False,
        })


@login_required(login_url='/login')
@csrf_exempt
def filter_report(request):
    try:
        if request.user.is_authenticated:
            first_date = request.POST.get('firstDate').split('/')
            gregorian_first_date = JalaliDate(int(first_date[0]), int(first_date[1]), int(first_date[2])).to_gregorian()
            end_date = request.POST.get('endDate').split('/')
            gregorian_end_date = JalaliDate(int(end_date[0]), int(end_date[1]),
                                            int(end_date[2])).to_gregorian() + datetime.timedelta(1)

            index = request.POST.get('dbId')
            geo_data = GeoData.objects.get(id=index)
            changes = Changes.objects.filter(geo_data=geo_data, date__range=(gregorian_first_date, gregorian_end_date))
            changes_list = []
            for change in changes:
                item = {
                    'username': change.user.username,
                    'key': change.key,
                    'old_value': change.old_value,
                    'new_value': change.new_value,
                    'date': change.jDate_serializable,
                }
                changes_list.append(item)
            return JsonResponse({
                'check': True, 'changes': changes_list
            })
        else:
            return JsonResponse({'check': False})

    except Exception as e:
        print(e)
        return JsonResponse({
            'check': False,
        })


@login_required(login_url='/login')
@csrf_exempt
def cancel_changes(request):
    try:
        if request.user.is_authenticated:
            dbId = request.POST.get('dbId')
            key = request.POST.get('key')
            geo_data = GeoData.objects.get(id=dbId)
            change = Changes.objects.get(geo_data=geo_data, key=key)
            change.delete()
            return JsonResponse({
                'check': True,
            })
        else:
            return JsonResponse({'check': False})

    except Exception as e:
        print(e)
        return JsonResponse({
            'check': False,
        })


@login_required(login_url='/login')
def add_doc(request):
    feature = GeoData.objects.all().first()
    url = feature.property['sardar']
    file_name = "downloaded_image.jpg"

    file_name = "downloaded_image.jpg"

    try:
        # دانلود فایل
        urllib.request.urlretrieve(url, file_name)
    except Exception as e:
        print(f"خطا در دانلود فایل: {e}")
    return JsonResponse({'s': feature.property['sardar']})


@login_required(login_url='/login')
def report_panel(request, category):
    all_data = GeoData.objects.all()
    all_new_data = []
    for new_data in all_data:
        if new_data.property not in all_new_data:
            all_new_data.append(new_data.property)
    all_features = []
    ownerTypes = []
    for data in all_new_data:
        if category == 'all':
            item = {'vahed': data['vahed'], 'ownerType': data['malekiat'], 'geometryArea': data['arse']}
        else:
            item = {'vahed': data['vahed'], 'ownerType': data[category], 'geometryArea': data['arse']}
        if item['ownerType'] not in ownerTypes:
            ownerTypes.append(item['ownerType'])
        all_features.append(item)
    grouped_data = {}
    for item in all_features:
        vahed = item['vahed']
        if vahed not in grouped_data:
            grouped_data[vahed] = []
        grouped_data[vahed].append(item)

    result = list(grouped_data.values())
    context = {
        'ownerType': result
    }
    return render(request, 'reportPanel.html', context)


@login_required(login_url='/login')
def temporary_chart(request, chart_id, category):
    new_temp_chart = TemporaryChart.objects.get(id=chart_id)
    all_new_data = []
    for new_data in new_temp_chart.geojson['features']:
        if new_data not in all_new_data:
            all_new_data.append(new_data)
    all_features = []
    ownerTypes = []
    for data in all_new_data:
        item = {'vahed': data['properties']['vahed'], 'ownerType': data['properties'][category],
                'geometryArea': data['properties']['arse']}
        if item['ownerType'] not in ownerTypes:
            ownerTypes.append(item['ownerType'])
        all_features.append(item)
    grouped_data = {}
    for item in all_features:
        vahed = item['vahed']
        if vahed not in grouped_data:
            grouped_data[vahed] = []
        grouped_data[vahed].append(item)

    result = list(grouped_data.values())
    context = {
        'ownerType': result
    }
    return render(request, 'reportPanel.html', context)


@login_required(login_url='/login')
def create_chart_ajax(request):
    geojson = request.FILES.get('geojson')
    geojson_data = json.load(geojson)
    new_data = TemporaryChart.objects.create(geojson=geojson_data)
    return JsonResponse({'check': True, 'chartId': new_data.id})


@login_required(login_url='/login')
def save_bookmark(request):
    geojson = request.FILES.get('geojson')
    name = request.POST.get('name')
    geojson_data = json.load(geojson)
    exist = MainBookmark.objects.filter(name=name, user=request.user)
    if exist:
        return JsonResponse({'check': False, 'exist': True})
    else:
        saved = MainBookmark.objects.create(name=name, user=request.user)
        if 'features' in geojson_data:
            for feature in geojson_data['features']:
                geom_data = feature.get('geometry', {})
                properties = feature.get('properties', {})
                geom = GEOSGeometry(json.dumps(geom_data))
                BookmarkGeo.objects.create(
                    bookmark=saved,
                    geom=geom,
                    property=properties,
                    image=None
                )

    return JsonResponse({'check': True, })


@login_required(login_url='/login')
def delete_bookmark(request):
    name = request.POST.get('name')
    exist = BookmarkGeo.objects.filter(name=name)
    if exist:
        for file in exist:
            file.delete()
        return JsonResponse({'check': False, 'exist': True})
    else:
        return JsonResponse({'check': False, 'exist': False})

    return JsonResponse({'check': True, })


@login_required(login_url='/login')
def add_new_file(request):
    if request.method == 'POST':
        try:
            geojson_file = request.FILES.get('geojson_file')
            if geojson_file:
                geojson_data = json.load(geojson_file)
                geom = None
                if geojson_data['type'] == 'FeatureCollection' and geojson_data['features']:
                    feature = geojson_data['features'][0]
                    if feature['geometry']:
                        geom = GEOSGeometry(json.dumps(feature['geometry']))

                if not geom:
                    return JsonResponse({'error': 'فایل GeoJSON فاقد هندسه معتبر است.'}, status=400)
                other_properties = {}
                for key, value in request.POST.items():
                    if key != 'geojson_file':
                        other_properties[key] = value

                geo_data_instance = GeoData(geom=geom, property=other_properties)
                geo_data_instance.save()

                return JsonResponse({'message': 'داده ها با موفقیت ذخیره شدند.'}, status=201)

            else:
                return JsonResponse({'error': 'فایل GeoJSON ارسال نشده است.'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'خطا در تجزیه فایل GeoJSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'خطا در پردازش درخواست: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'این endpoint فقط از متد POST پشتیبانی می کند.'}, status=405)


@login_required(login_url='/login')
def add_images(request):
    all_geometries = GeoData.objects.all()
    index = 0
    for geo in all_geometries:
        index += 1
        image_link = geo.property.get('sardar')
        if image_link:
            try:
                response = requests.get(image_link)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content))
                converted_image = BytesIO()
                image.convert("RGB").save(converted_image, format="JPEG")
                converted_image.seek(0)
                file_name = f"{geo.id}_image.jpg"
                django_file = ContentFile(converted_image.getvalue(), name=file_name)
                geo.image = django_file
                geo.save()
            except Exception as e:
                print(f"خطا در پردازش تصویر: {e}")
    return JsonResponse({'check': True})


@login_required(login_url='/login')
@csrf_exempt
def get_geo_doc(request):
    data = request.POST.get('dbId')
    geo = GeoData.objects.get(id=data)
    documents = Documents.objects.filter(geo_data=geo)
    all_documents = []
    for document in documents:
        item = {
            'id': document.id,
            'fileName': document.name,
            'vahedName': document.vahed_name(),
            'onvanName': document.onvan_name(),
            'uploadedBy': document.uploaded_by.username,
            'uploadedDate': document.upload_date_jalali()
        }
        all_documents.append(item)
    return JsonResponse({'check': True, 'documents': all_documents})


@login_required(login_url='/login')
@csrf_exempt
def rename_layer(request):
    try:
        data = request.POST.get('mainId')
        name = request.POST.get('name')
        geo = MainGeoData.objects.get(id=data)
        geo.name = name
        geo.save()
        return JsonResponse({'check': True})
    except:
        return JsonResponse({'check': False})


@login_required(login_url='/login')
@csrf_exempt
def edit_comment(request):
    try:
        data = request.POST.get('dbId')
        comment = request.POST.get('comment')
        geo = GeoData.objects.get(id=data)
        geo.comment = comment
        geo.save()
        return JsonResponse({'check': True})
    except:
        return JsonResponse({'check': False})


@login_required(login_url='/login')
@csrf_exempt
def owner_edit_comment(request):
    try:
        data = request.POST.get('dbId')
        comment_ = request.POST.get('comment')
        geo = GeoData.objects.get(id=data)
        comment = UserComments.objects.filter(user=request.user, geo=geo)
        if comment.exists():
            comment = comment.first()
            comment.text = comment_
            comment.save()
        else:
            UserComments.objects.create(text=comment_, geo=geo, user=request.user)
        return JsonResponse({'check': True})
    except Exception as e:
        return JsonResponse({'check': False, 'e': repr(e)})


@login_required(login_url='/login')
@csrf_exempt
def get_doc_detail(request):
    data = request.POST.get('dbId')
    document = Documents.objects.get(id=data)
    item = {
        'id': document.id,
        'docName': document.name,
        'onvanName': document.geo_data.property['onvan'],
        'vahedName': document.geo_data.property['vahed'],
        'uploadedBy': document.uploaded_by.username,
        'uploadedDate': document.upload_date_jalali(),
        'downloadUrl': document.file.url or None
    }
    return JsonResponse({'check': True, 'document': item})


@login_required(login_url='/login')
@csrf_exempt
def search_property(request):
    query = request.GET.get('query', '')
    results = GeoData.objects.filter(property__icontains=query) if query else []
    data = [{"id": geo.id, 'name': geo.property['onvan'], "property": geo.property} for geo in results]
    return JsonResponse({"results": data})


@login_required(login_url='/login')
@csrf_exempt
def find_documents(request):
    # try:
    name = request.POST.get('name')
    ostan = request.POST.get('ostan')
    all_documents = []
    for data in GeoData.objects.all():
        if data.property['vahed'] == name and data.property['ostan'] == ostan:
            document = Documents.objects.filter(geo_data=data)
            document_list = []
            for doc in document:
                item = {
                    'id': doc.id,
                    'docName': doc.name,
                    'onvanName': doc.geo_data.property['onvan'],
                    'vahedName': doc.geo_data.property['vahed'],
                    'uploadedBy': doc.uploaded_by.username,
                    'uploadedDate': doc.upload_date_jalali(),
                    'downloadUrl': doc.file.url or None
                }
                document_list.append(item)
            all_documents.append(document_list)
    return JsonResponse({'check': True, 'data': all_documents})


@login_required(login_url='/login')
@csrf_exempt
def upload_document(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        db_id = request.POST.get('dbId')
        uploaded_file = request.FILES.get('file')

        if uploaded_file:
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.pdf', '.zip', '.rar', '.dwg']:
                return JsonResponse({'check': False, 'message': 'فرمت فایل مجاز نیست'})
            geo_data = GeoData.objects.get(id=db_id)
            new_document = Documents.objects.create(name=title, geo_data=geo_data, file=uploaded_file,
                                                    uploaded_by=request.user)
            return JsonResponse({'check': True,
                                 'docId': new_document.id,
                                 'fileName': title,
                                 'vahedName': geo_data.property['vahed'],
                                 'onvanName': geo_data.property['onvan'],
                                 'uploadedBy': request.user.username,
                                 })

        return JsonResponse({'check': False, 'message': 'فایلی ارسال نشده است'})
    return JsonResponse({'check': False, 'message': 'درخواست نامعتبر است'})


@login_required(login_url='/login')
@require_POST
def update_geometry(request):
    db_id = request.POST.get('dbId')
    geom_json = request.POST.get('geom')

    if not db_id or not geom_json:
        return JsonResponse({'status': 'error', 'message': 'پارامترهای ارسالی ناقص است.'})

    try:
        geo_data = GeoData.objects.get(pk=db_id)
    except GeoData.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'رکورد پیدا نشد.'})

    try:
        geom = GEOSGeometry(geom_json)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'خطا در هندسه: {str(e)}'})

    geo_data.geom = geom
    geo_data.save()

    return JsonResponse({'status': 'success', 'message': 'مختصات با موفقیت به‌روزرسانی شد.'})