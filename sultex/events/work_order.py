import frappe
import json
from erpnext.stock.get_item_details import get_conversion_factor


@frappe.whitelist()
def get_uom(item_code):
    return frappe.db.get_value('Item', item_code, 'stock_uom')


@frappe.whitelist()
def get_req_items_details(item_code,bom_no):
    bom = frappe.get_doc("BOM",bom_no)
    for item in bom.items:
        if item.item_code == item_code:
           return item.uom , item.qty

@frappe.whitelist()
def fetch_items_from_sales_order(sales_order):
    sales_order = json.loads(sales_order)
    so = frappe.get_doc('Sales Order', sales_order[0])
    item = so.items[0]
    if frappe.db.exists('Item', {
        'name': item.item_code,
        'is_stock_item': 1,
        'default_bom': ['!=', '']
    }):
        return {'item': item.item_code, 'qty': item.qty}
    else:
        frappe.msgprint(
            'Make sure selected item is a Stock Item and has a Default Bom set')


@frappe.whitelist()
def stop_execution(expected_delivery_date,planned_start_date,name):
    if expected_delivery_date < planned_start_date:
        val=None
        frappe.db.set_value('Work Order', name, 'expected_delivery_date',val)
        frappe.throw('please make sure that expected delivery date is smaller then planned start date')

@frappe.whitelist()
def fetch_items_from_work_order(work_order):
    work_order = json.loads(work_order)
    wo = frappe.get_doc('Work Order', work_order[0])
    if len(wo.required_items) == 1:
        item = wo.required_items[0]
        if frappe.db.exists('Item', {
            'name': item.item_code,
            'is_stock_item': 1,
            'default_bom': ['!=', '']
        }):
            return {'item': item.item_code, 'qty': item.required_qty}
        else:
            frappe.msgprint(
                'Make sure selected item is a Stock Item and has a Default Bom set')
    else:
        frappe.msgprint('Invalid Selection')


@frappe.whitelist()
def sales_order_query(sales_order,work_order):
    data=[]
    result = frappe.db.get_list('Sales Order Item',
                                filters={
                                    'parent': sales_order
                                },
                                fields=['*'],
                                order_by='idx')
    for row in result:
        wo_list=frappe.db.get_list("Work Order",
                                filters={
                                    'name': ['not in',[work_order]],
                                    'docstatus':1,
                                    'expected_delivery_date':row.delivery_date,
                                    'production_item':row.item_code,
                                    'sales_order':sales_order,
                                },
                                fields=['*']
                                )
        total=0
        qty=0
        for itm in wo_list:
            total+=itm.qty
        qty=row.qty-total
        if qty > 0:
            row.update({'qty':qty})
            data.append(row)

    return data


@frappe.whitelist()
def work_order_query():
    result = frappe.db.get_list('Work Order Item',  filters={'item_allocated': 0},
                                fields=['item_code', 'item_name', 'required_qty', 'parent'])
    return result


@frappe.whitelist()
def get_secondary_uom(item_code):
    item = frappe.get_doc("Item", item_code)
    uom = []

    if len(item.uoms) > 1:
        for row in item.uoms:
            cf = get_conversion_factor(item.item_code, row.uom)

            new_row = {
                "uom": row.uom,
                "conversion_factor": cf.get("conversion_factor")
            }

            uom.append(new_row)

    return uom


def validate(doc, method=None):
    if doc.get("from_work_order"):
        frappe.db.set_value('Work Order Item', {'parent': doc.from_work_order, 'item_code': doc.production_item}, 'item_allocated', '1')
        frappe.db.commit()
        
    bom = frappe.get_doc("BOM",doc.bom_no)
    for item in doc.required_items:
        for row in bom.items:
            if item.item_code == row.item_code:
                item.required_qty = row.qty * doc.qty
                item.uom = row.uom
    doc.work_order_secondary_uom = []
    item = frappe.get_doc("Item", doc.production_item)
    for uom in item.uoms:
        um = doc.append("work_order_secondary_uom")
        um.uom = uom.uom
        um.conversion_factor = uom.conversion_factor
        um.qty = uom.conversion_factor * doc.qty
    if doc.tracking_id in frappe.db.get_list("Work Order", filters={"from_work_order":["!=", doc.name]}, fields=["tracking_id"]):
        frappe.throw("Tracking ID must be unique!")

def submit(doc, method=None):
    if not doc.dynamic_work_order:
        items = get_all_items(doc)
        wk=[]
        for row in items:
            if row['bom_no']:
                project=secondary_qty=secondary_uom=wip_warehouse=fg_warehouse=scrap_warehouse=''
                if doc.project:
                    project = doc.project
                if doc.secondary_qty:
                    secondary_qty = doc.secondary_qty
                if doc.secondary_uom:
                    secondary_uom = doc.secondary_uom
                if doc.wip_warehouse:
                    wip_warehouse = doc.wip_warehouse
                if doc.fg_warehouse:
                    fg_warehouse = doc.fg_warehouse
                if doc.scrap_warehouse:
                    scrap_warehouse = doc.scrap_warehouse
                work_order_doc = frappe.get_doc({
                    'doctype': 'Work Order',
                    'naming_series':doc.naming_series,
                    'status': 'Draft',
                    'tracking_id':doc.tracking_id,
                    'company': doc.company,
                    'production_item':row['item_code'],
                    'qty':row['qty']*doc.qty,
                    'custom_stock_uom':row['stock_uom'],
                    'bom_no':row['bom_no'],
                    'description':row['description'],
                    'dynamic_work_order':doc.name,
                    'project':project,
                    'secondary_qty':secondary_qty,
                    'expected_delivery_date':doc.expected_delivery_date,
                    'secondary_uom':secondary_uom,
                    'wip_warehouse':wip_warehouse,
                    'fg_warehouse':fg_warehouse,
                    'scrap_warehouse':scrap_warehouse,
                    'planned_start_date':doc.planned_start_date,
                    'reference_work_order':doc.reference_work_order,
                })
                work_order_doc.save()
                wk.append(work_order_doc)



def get_bom(item):
    bom_exists=frappe.db.exists('BOM', {'item':item,'is_active':1,'is_default':1})
    if bom_exists:
        bom_doc = frappe.get_doc('BOM', {'item':item,'is_active':1,'is_default':1})
    else:
        bom_doc=0
    return bom_doc

def bom_items(bom_doc):
    items=[]
    if bom_doc is not 0:
        for row in bom_doc.items:
            bom_doc=get_bom(row.item_code)
            if bom_doc is not 0: 
                items.append({
                    'item_code':row.item_code,
                    'qty':row.qty,
                    'bom_no':bom_doc.name,
                    'stock_uom':row.stock_uom,
                    'description':row.description,
                })
    return items

def bom_child_items(bom_doc,qty=None):
    items=[]
    if bom_doc is not 0:
        for row in bom_doc.items:
            bom_doc=get_bom(row.item_code)
            if bom_doc is not 0: 
                items.append({
                    'item_code':row.item_code,
                    'qty':row.qty*qty,
                    'bom_no':bom_doc.name,
                    'stock_uom':row.stock_uom,
                    'description':row.description,
                })
    return items

def check_items_bom(items):
    itembomlist=[]
    for row in items:
        bom_exists=frappe.db.exists('BOM', {'item':row['item_code'],'is_active':1,'is_default':1})
        if bom_exists:
            bom_doc = frappe.get_doc('BOM', {'item':row['item_code'],'is_active':1,'is_default':1})
            itembomlist.append({
                    'item_code':row['item_code'],
                    'qty':row['qty'],
                    'bom_no':bom_doc.name,
                    'stock_uom':row['stock_uom'],
                    'description':row['description'],
                })
    return itembomlist

def get_all_items(doc):
    total_items=[]
    check=False
    bom_doc=get_bom(doc.production_item)
    if bom_doc is not 0:
        items=bom_items(bom_doc)
        for row in items:
            total_items.append(row)
        check=True
    while check == True:
        ttl_items=[]
        for row in items:
            if items:
                bom_do=get_bom(row['item_code'])
                if bom_do is not 0:
                    item=bom_child_items(bom_do,row['qty'])
                    items_bom_list=check_items_bom(item)
                    if len(items_bom_list)>0:
                        for itm in items_bom_list:
                            ttl_items.append(itm)
        items=[]
        for row in ttl_items:
            items.append(row)
            total_items.append(row)
        if len(ttl_items) is 0:
            check=False
    
    return total_items