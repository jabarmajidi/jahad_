from django.urls import path

from .views import *

urlpatterns = [
    path('', main_map),
    path('change-properties', change_properties),
    path('delete-change', delete_change),
    path('approve-change', approve_change),
    path('get-feature-report', get_feature_report),
    path('filter-report', filter_report),
    path('create-chart', create_chart_ajax),
    path('save-bookmark', save_bookmark),
    path('delete-bookmark', delete_bookmark),
    path('get-temporary-chart/<chart_id>/<category>', temporary_chart),
    path('cancel-changes', cancel_changes),
    path('add-doc', add_doc),
    path('report-panel/<category>', report_panel),
    path('add-new-file', add_new_file),
    path('add-images', add_images),
    path('get_doc_data', get_doc_data),
    path('get-geo-doc', get_geo_doc),
    path('get-doc-detail', get_doc_detail),
    path('edit-comment', edit_comment),
    path('rename-layer', rename_layer),
    path('owner-edit-comment', owner_edit_comment),
    path('find-document', find_documents),
    path('upload-document', upload_document),
    path('search-property/', search_property, name='search-property'),
    path('update-geometry', update_geometry),
    path('api/geodata/', geojson_api, name='geojson_api'),
    path('api/iran/', iran_geojson_api, name='iran_geojson_api'),
    path('api/bookmarks/', bookmarks_api, name='bookmarks_api'),
]
