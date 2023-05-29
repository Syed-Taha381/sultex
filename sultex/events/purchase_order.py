import frappe

@frappe.whitelist()
def get_tac(doc, method=None):
	tac = frappe.db.get_value("Item", doc.items[0].item_code, "terms_and_conditions")
	if tac:
		doc.tc_name = tac