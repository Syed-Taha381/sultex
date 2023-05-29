import frappe
import json

@frappe.whitelist()
def sales_inv_query_fro_sales_order(sales_order,sales_invoice):
    data=[]
    result = frappe.db.get_list('Sales Order Item',
                                filters={
                                    'parent': sales_order
                                },
                                fields=['*'],
                                order_by='idx')
    for row in result:
        si=frappe.db.get_list("Sales Invoice",
                                filters={
                                    'name': ['not in',[sales_invoice]],
                                    'docstatus':1,
                                    'sales_order':sales_order,
                                },
                                fields=['*']
                                )
        total=0
        qty=0
        for itm in si:
            doc=frappe.get_doc('Sales Invoice',itm.name)
            for val in doc.items:
                if val.item_code==row.item_code and val.delivery_date==row.delivery_date:
                    total+=val.qty
        qty=row.qty-total
        if qty > 0:
            row.update({'qty':qty})
            data.append(row)

    return data

