import frappe

@frappe.whitelist()
def post_jv(doc, method=None):

	if doc.bill_from:
		jv = frappe.new_doc("Journal Entry")
		jv.posting_date = doc.posting_date
		jv.voucher_type = "Journal Entry"
		jv.append("accounts", {
			"account": doc.credit_to,
			"party_type": "Supplier",
			"party": doc.supplier,
			"debit_in_account_currency": doc.grand_total,
			"reference_type": "Purchase Invoice",
			"reference_name":doc.name
			})
		jv.append("accounts", {
			"account": doc.credit_to,
			"party_type": "Supplier",
			"party": doc.bill_from,
			"credit_in_account_currency": doc.grand_total
			})
		jv.bill_no = doc.bill_no,
		jv.bill_date = doc.bill_date
		jv.save()
		jv.submit()