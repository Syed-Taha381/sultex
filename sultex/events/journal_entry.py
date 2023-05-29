import json
import frappe

@frappe.whitelist()
def validate_chq(doc, methhod=None):
    if frappe.db.exists("Journal Entry", {"docstatus":1, "cheque_no":doc.cheque_no}):
        frappe.throw("Refernece / Cheque No must be unique")
