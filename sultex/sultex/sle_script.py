import frappe
from frappe.utils import cstr, getdate
import json
from frappe.utils.background_jobs import enqueue




@frappe.whitelist(allow_guest=True)
def scheduler_job():
    enqueue("sultex.sultex.sle_script.update_sle", queue='long', timeout=None)
    return 'successfully queued sultex.sultex.sle_script.update_sle'

@frappe.whitelist(allow_guest=True)
def update_sle():
	sle_object = {
		"Query Report":[
		 {
		  "Date": "2022-06-30 23:42:00.000000",
		  "Item": "RM00113",
		  "Item Name": "6sOE PC - IMTIAZ",
		  "Stock UOM": "Lbs",
		  "In Qty": 0,
		  "Out Qty": 0,
		  "Balance Qty": 0,
		  "Voucher #": "MAT-RECO-2022-00243",
		  "Warehouse": "E-7 SULTEX YARN WAREHOUSE - SI",
		  "Incoming Rate": 0,
		  "Valuation Rate": 0,
		  "Balance Value": 0,
		  "Value Change": 0,
		  "Voucher #": "MAT-RECO-2022-00243",
		  "Company": "Sultex Industries"
		 },
		 {
		  "Date": "2022-11-29 12:21:07.036875",
		  "Item": "RM00113",
		  "Item Name": "6sOE PC - IMTIAZ",
		  "Stock UOM": "Lbs",
		  "In Qty": 20000,
		  "Out Qty": 0,
		  "Balance Qty": 20000,
		  "Voucher #": "MAT-PRE-2022-02144-1",
		  "Warehouse": "E-7 SULTEX YARN WAREHOUSE - SI",
		  "Incoming Rate": 143,
		  "Valuation Rate": 143,
		  "Balance Value": 2860000,
		  "Value Change": 2860000,
		  "Voucher #": "MAT-PRE-2022-02144-1",
		  "Company": "Sultex Industries"
		 },
		 {
		  "Date": "2022-12-10 16:28:35.726972",
		  "Item": "RM00113",
		  "Item Name": "6sOE PC - IMTIAZ",
		  "Stock UOM": "Lbs",
		  "In Qty": 17300,
		  "Out Qty": 0,
		  "Balance Qty": 37300,
		  "Voucher #": "MAT-PRE-2022-02151",
		  "Warehouse": "E-7 SULTEX YARN WAREHOUSE - SI",
		  "Incoming Rate": 143,
		  "Valuation Rate": 143,
		  "Balance Value": 5333900,
		  "Value Change": 2473900,
		  "Voucher #": "MAT-PRE-2022-02151",
		  "Company": "Sultex Industries"
		 },
		 {
		  "Date": "2022-12-28 14:40:28.327585",
		  "Item": "RM00113",
		  "Item Name": "6sOE PC - IMTIAZ",
		  "Stock UOM": "Lbs",
		  "In Qty": 13700,
		  "Out Qty": 0,
		  "Balance Qty": 51000,
		  "Voucher #": "MAT-PRE-2022-02245",
		  "Warehouse": "E-7 SULTEX YARN WAREHOUSE - SI",
		  "Incoming Rate": 143,
		  "Valuation Rate": 143,
		  "Balance Value": 7293000,
		  "Value Change": 1959100,
		  "Voucher #": "MAT-PRE-2022-02245",
		  "Company": "Sultex Industries"
		 },
		 {
		  "Date": "2022-12-28 14:41:26.239897",
		  "Item": "RM00113",
		  "Item Name": "6sOE PC - IMTIAZ",
		  "Stock UOM": "Lbs",
		  "In Qty": 19500,
		  "Out Qty": 0,
		  "Balance Qty": 70500,
		  "Voucher #": "MAT-PRE-2022-02246",
		  "Warehouse": "E-7 SULTEX YARN WAREHOUSE - SI",
		  "Incoming Rate": 150,
		  "Valuation Rate": 144.936170213,
		  "Balance Value": 10218000,
		  "Value Change": 2925000,
		  "Voucher #": "MAT-PRE-2022-02246",
		  "Company": "Sultex Industries"
		 }
		]
	}

	entry_count = 0
	for key in sle_object.keys():
		for entry in sle_object[key]:
			if "Date" in entry.keys():
				post_datetime = entry["Date"].split(" ")
				posting_date = getdate(post_datetime[0])
				posting_time = post_datetime[1]
				record_exists = frappe.db.exists("Stock Ledger Entry", {"item_code" : entry["Item"],
				"warehouse" : entry["Warehouse"], "posting_date": posting_date, "posting_time": posting_time})
				if record_exists:
					doc = frappe.get_last_doc("Stock Ledger Entry", filters = {"item_code" : entry["Item"],
					"warehouse" : entry["Warehouse"], "posting_date": posting_date, "posting_time": posting_time})
					
					actual_qty = 0.0
					if entry["In Qty"]>=0 and entry["Out Qty"]==0:
						actual_qty = float(entry["In Qty"])

					if entry["In Qty"]==0 and entry["Out Qty"]<0:
						actual_qty = float(entry["Out Qty"])

					doc.db_set('actual_qty', actual_qty, commit=True, update_modified=False)
					doc.db_set('qty_after_transaction', float(entry["Balance Qty"]), commit=True, update_modified=False)
					doc.db_set('incoming_rate', float(entry["Incoming Rate"]), commit=True, update_modified=False)
					doc.db_set('valuation_rate', float(entry["Valuation Rate"]), commit=True, update_modified=False)
					doc.db_set('stock_value', float(entry["Balance Value"]), commit=True, update_modified=False)
					doc.db_set('stock_value_difference', float(entry["Value Change"]), commit=True, update_modified=False)
					frappe.msgprint(cstr("Successfully updated"))
					entry_count +=1
	return 'Successfully updated {entry_count} entries.'





# @frappe.whitelist(allow_guest=True)
# def update_sle(sle=None, valuation_rate=0.0, qty_after_transaction=0.0, stock_value=0.0):
	
# 	doc = frappe.get_doc("Stock Ledger Entry", sle)
# 	doc.db_set('valuation_rate', valuation_rate, commit=True, update_modified=False)
# 	doc.db_set('qty_after_transaction', qty_after_transaction, commit=True, update_modified=False)
# 	doc.db_set('stock_value', stock_value, commit=True, update_modified=False)
# 	frappe.msgprint(cstr("Successfully updated"))
# 	return 'success'