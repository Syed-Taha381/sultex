import frappe

@frappe.whitelist()
def sales_inv_query_fro_sales_order(sales_order,delivery_note):
    data=[]
    result = frappe.db.get_list('Sales Order Item',
                                filters={
                                    'parent': sales_order
                                },
                                fields=['*'],
                                order_by='idx')
    for row in result:
        si=frappe.db.get_list("Delivery Note",
                                filters={
                                    'name': ['not in',[delivery_note]],
                                    'docstatus':1,
                                    'sales_order':sales_order,
                                },
                                fields=['*']
                                )
        total=0
        qty=0
        for itm in si:
            doc=frappe.get_doc('Delivery Note',itm.name)
            for val in doc.items:
                if val.item_code==row.item_code and val.delivery_date==row.delivery_date:
                    total+=val.qty
        qty=row.qty-total
        if qty > 0:
            row.update({'qty':qty})
            data.append(row)

    return data


def validate(doc, method=None):
    sort = {}
    new_list = []
    # Total_net_weight
    total_nw = 0
    if doc.items:
        for row in doc.items:
            assending = row.from_pkg_no
            total_nw += row.total_net_weight

            if assending not in sort:
                sort[str(assending)] = row
                new_list.append(int(assending))

    new_list.sort()

    doc.items = []
    for row in new_list:
        row = str(row)
        adding_list = sort[row]

        doc.append('items', adding_list)
    doc.set_missing_values()
    doc.total_net_weight = total_nw
