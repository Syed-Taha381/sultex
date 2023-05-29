import frappe

@frappe.whitelist()
def secondary_qty(doc, method = None):
    if doc.stock_entry_type=='Manufacture' and doc.work_order and doc.secondary_quantity:
        frappe.db.set_value('Work Order', doc.work_order, 'secondary_qty', doc.secondary_quantity )

def cancel(doc, method = None):
    if doc.stock_entry_type=='Manufacture' and doc.work_order and doc.secondary_quantity:
        frappe.db.set_value('Work Order', doc.work_order, 'secondary_qty','')
