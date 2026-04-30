---
title: "CDS Views"
description: "In this sub section you can track how to create a CDS (Core Data Services) View using ABAP Development Tools (ADT). In our specific case, it is demonstrated how to create a CDS View to access data of "
---
## Create a simple ABAP CDS View in ADT

In this sub section you can track how to create a CDS (Core Data Services) View using ABAP Development Tools (ADT). In our specific case, it is demonstrated how to create a CDS View to access data of the EPM table SNWD_BPA, which contains the Business Partner record set.

1. Create a CDS View
In the context menu of your package choose ***New*** and then choose ***Other ABAP Repository Object***.<br><br>
![](/images/1-001a.JPG)

2.	Select ***Data Definition***, then choose ***Next***.<br><br>
![](/images/1-002a.JPG)

3. Enter the following values, then choose Next.
- Name, e.g. ```Z_CDS_EPM_BUPA```
- Description: **CDS View for EPM Business Partner Extraction**
- Referenced Object: **SNWD_BPA**<br><br>
![](/images/1-003a.JPG)

4.	Accept the default transport request (local) by simply choosing ***Next*** again.<br><br>
![](/images/1-004a.JPG)

5.	Select the entry ***Define View***, then choose ***Finish***.<br><br>
![](/images/1-005a.JPG)

6.	The new view appears in an editor, with an error showing up because of the still missing SQL View name.<br>
In this editor, enter value for the SQL View name in the annotation **`@AbapCatalog.sqlViewName`**, e.g. **`Z_SQL_EPM_BUPA`**.<br>
The SQL view name is the internal/technical name of the view which will be created in the database.<br>
**`Z_CDS_EPM_BUPA`** is the name of the CDS view which provides enhanced view-building capabilities in ABAP. 
You should always use the CDS view name in your ABAP applications.<br><br>
The data source plus its fields have automatically been added to the view definition because of the reference to the data source object we gave in step 3.
If you haven't provided that value before, you can easily search for and add your data source using the keyboard shortcut ***CTRL+SPACE***.<br><br>
![](/images/1-006a.JPG)

7.	Delete the not needed fields in the SELECT statement, add the annotation ```@ClientHandling.type: #CLIENT_DEPENDENT``` and beautify the view.<br><br>
   ![](/images/1-007a.JPG)<br><br>
   The code may now look as follows:
     ```abap
     @AbapCatalog.sqlViewName: 'Z_SQL_EPM_BUPA'
     @AbapCatalog.compiler.compareFilter: true
     @AbapCatalog.preserveKey: true
     @ClientHandling.type: #CLIENT_DEPENDENT
     @AccessControl.authorizationCheck: #CHECK
     @EndUserText.label: 'CDS View for EPM Business Partner Extraction'
     
     define view Z_CDS_EPM_BUPA
         as select from SNWD_BPA
         
     {
         key node_key as NodeKey,
             bp_role as BpRole,
             email_address as EmailAddress,
             phone_number as PhoneNumber,
             fax_number as FaxNumber,
             web_address as WebAddress,
             address_guid as AddressGuid,
             bp_id as BpId,
             company_name as CompanyName,
             legal_form as LegalForm,
             created_at as CreatedAt,
             changed_at as ChangedAt,
             currency_code as CurrencyCode
     }
     ```

8.	***Save (CTRL+S or disk symbol in menue bar)*** and ***Activate (CTRL+F3 or magic wand symbol in menue bar)*** the CDS View.<br>
(first ![](/images/1-008a.JPG) 
then ![](/images/1-008b.JPG))<br><br>

9.	We are now able to verify the results in the ***Data Preview*** by choosing ***F8***. Our CDS View data preview should look like this:<br><br>
![](/images/1-009a.JPG)<br><br>

We have now successfully created the first simple CDS View in SAP S/4HANA. In the next step we'll showing how we can enable it for delta processing based on CDC.

## Create a more complex ABAP CDS View in ADT (joining multiple tables)

Create a more complex ABAP CDS View, again using the ABAP Development Tools (ADT). We will go through the implementation of an ABAP CDS View which will join the EPM tables `SNWD_SO`, `SNWD_SO_I`, `SNWD_PD`, and `SNWD_TEXTS` in order to fetch all Sales Order relevant data, including its positions, products, and product names.<br>

The relevant tables for our scenario are

BUSINESS PARTNER (SNWD_BPA),
SALES ORDER HEADER (SNWD_SO),
SALES ORDER ITEM (SNWD_SO_I),
PRODUCT (SNWD_PD),
and TEXTS (SNWD_TEXTS).

Here is how these tables relate to each other:

![](/images/epm-001b.jpg)

In a later step, also this ABAP CDS View will be enabled for Change Data Capturing (CDC) for an event based processing of Sales Order related deltas to the target storage in S3.<br><br>

1. Create a CDS View
In the context menu of your package choose ***New*** and then choose ***Other ABAP Repository Object***.<br><br>
![](/images/1-001a.JPG)

2. Select ***Data Definition***, then choose ***Next***.<br><br>
![](/images/1-002a.JPG)

3. Enter the following values, then choose Next.
- Name, e.g. ```Z_CDS_EPM_SO```
- Description: **CDS View for EPM Sales Order object extraction**
- Referenced Object: **SNWD_SO**<br><br>
![](/images/dd1-012a.JPG)

4. Accept the default transport request (local) by simply choosing ***Next*** again.<br><br>
![](/images/1-004a.JPG)

5. Select the entry ***Define View***, then choose ***Finish***.<br><br>
![](/images/1-005a.JPG)

6. The new view appears in an editor, with an error showing up because of the still missing SQL View name.<br>
In this editor, enter value for the SQL View name in the annotation **`@AbapCatalog.sqlViewName`**, e.g. **`Z_SQL_EPM_SO`**.<br>
The SQL view name is the internal/technical name of the view which will be created in the database. 
**`Z_CDS_EPM_SO`** is the name of the CDS view which provides enhanced view-building capabilities in ABAP. 
You should always use the CDS view name in your ABAP applications.<br><br>
The pre-defined data source plus its fields have automatically been added to the view definition because of the reference to the data source object we gave in step 3.
If you haven't provided that value before, you can easily search for and add your data source using the keyboard shortcut ***CTRL+SPACE***.<br><br>
![](/images/dd1-013a.JPG)

7.	Delete the not needed fields in the SELECT statement, add the annotation ```@ClientHandling.type: #CLIENT_DEPENDENT``` and beautify the view a bit.<br><br>
![](/images/dd1-014a.JPG)<br><br>

8. For joining the EPM Sales Order Header table (`SNWD_SO`) with other related EPM tables (Sales Order Item: `SNWD_SO_I`, Product:`SNWD_PD`, Text (e.g. product names):`SNWD_TEXTS`), we can follow two different approaches.<br>
   - **JOINS**, according to classical SQL concepts and always fully executing this join condition whenever the CDS View is triggered.
     An example would be<br>```select from SNWD_SO as so left outer join SNWD_SO_I as item on so.node_key = item.parent_key```.
   - **ASSOCIATIONS**, which are a CDS View specific kind of joins. They can obtain data from the involved tables on Join conditions but the data is only fetched if required. For example, your CDS view has 4 Associations configured and user is fetching data for only 2 tables, the ASSOICATION on other 2 tables will not be triggered. This may save workload and may increase the query performance.<br> An example for a similar join condition with associations would be<br>```select from SNWD_SO as so association [0..1] to SNWD_SO_I as item	on so.node_key = item.parent_key```
   
   In our specific case, we always need to fetch data from all involved tables. Hence, we choose the classical JOIN for this example and include the following lines:<br>
   ...
   ```abap
   left outer join snwd_so_i as item on so.node_key = item.parent_key
   left outer join snwd_pd as prod on item.product_guid = prod.node_key
   left outer join snwd_texts as text on prod.name_guid = text.parent_key and text.language = 'E'
   ```
   ...<br><br>
   ![](/images/dd1-014b.JPG)<br><br>

9.	Add the wanted fields from the other tables in the join condition (and don't forget to make all key fields of all involved tables elements of the ABAP CDS View).<br><br>
   ![](/images/dd1-015a.JPG)<br><br>
   The ABAP CDS View may now look as follows:
     ```abap
     @AbapCatalog.sqlViewName: 'Z_SQL_EPM_SO'
     @AbapCatalog.compiler.compareFilter: true
     @AbapCatalog.preserveKey: true
     @ClientHandling.type: #CLIENT_DEPENDENT
     @AccessControl.authorizationCheck: #CHECK
     @EndUserText.label: 'CDS View for EPM Sales Order object extraction'
     
     define view Z_CDS_EPM_SO as select from snwd_so as so
         left outer join snwd_so_i as item on so.node_key = item.parent_key
         left outer join snwd_pd as prod on item.product_guid = prod.node_key
         left outer join snwd_texts as text on prod.name_guid = text.parent_key and text.language = 'E'
     {
         key item.node_key       as ItemGuid,
         so.node_key             as SalesOrderGuid,
         so.so_id                as SalesOrderId,
         so.created_at           as CreatedAt,
         so.changed_at           as ChangedAt,
         so.buyer_guid           as BuyerGuid,
         so.currency_code        as CurrencyCode,
         so.gross_amount         as GrossAmount,
         so.net_amount           as NetAmount,
         so.tax_amount           as TaxAmount,
         item.so_item_pos        as ItemPosition,
         prod.product_id         as ProductID,
         text.text               as ProductName,   
         prod.category           as ProductCategory,
         item.gross_amount       as ItemGrossAmount,
         item.net_amount         as ItemNetAmount,
         item.tax_amount         as ItemTaxAmount,
         prod.node_key           as ProductGuid,
         text.node_key           as TextGuid
     }
     ```

10. ***Save*** (CTRL+S or ![](/images/1-008a.JPG)) and ***Activate*** (CTRL+F3 or ![](/images/1-008b.JPG)) the CDS View.<br><br>

11. Verify the results in the ***Data Preview*** by pressing ***F8***. Our CDS View data preview should look like this:<br><br>
![](/images/dd1-016a.JPG)<br><br>

