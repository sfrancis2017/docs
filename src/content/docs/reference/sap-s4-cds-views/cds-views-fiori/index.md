---
title: "CDS Views"
description: "You want to create a new custom CDS views based on a pre-delivered SAP CDS view or a custom CDS view. With custom CDS views, you can merge data from various sources to tailor the data to your specific"
---
## Creating Custom CDS Views

You want to create a new custom CDS views based on a pre-delivered SAP CDS view or a custom CDS view. With custom CDS views, you can merge data from various sources to tailor the data to your specific business or process requirements.

Process Steps

1. Open the Custom CDS Views app.

2. Select the SAP delivered CDS view you want to use as primary data source for your custom CDS view. You can use either pre-delivered CDS views or custom objects you have created. Then click Create. Should you require parameters, you must select a primary data source that contains parameters –they can’t be added later. To identify primary data sources with parameters, add the Parameter column to the overview page.

3. On the General Tab choose a title for your custom CDS view and add an associated data source if required.

4. (Optional) You can add a further data sources by Association . To edit the association properties, click the Edit Association
Properties button which takes you to the Association Properties screen where you can define the following properties:

 - Select fields that are available in both the primary data source and the associated data sources to maintain a foreign key relationship.

 - Use the Cardinality drop down list to specify the type of relation between the source and the target of the association, for example Exactly one hit or One or more hits. Choosing the appropriate cardinality improves the run time performance. The correctness of results is not influenced by the choice of cardinality. It is recommended to use the Default option: In this case the system determines the required cardinality.

On the Field Selection tab, select the fields and associations that you want to use in your new Custom CDS view.

 - Note: Custom fields created within the Custom Fields and Logic app are also supported. For predelivered CDS views that are extensible, you can find custom fields in the Custom CDS Views app in two ways:

  - Directly in the predelivered CDS view (if already automatically extended in the Custom Fields and Logic app)• 
  - When opening the exposed extension association in the SAP CDS view. The custom CDS view interprets the view definition including all its defined custom fields (from both above described cases) and the these custom fields can be used freely when modeling a new custom view

You can define the following properties:
- You can define labels and aliases for the respective fields. An alias refers to unique technical name of a field, whereas a label specifies the visible field name on the UI. By clicking Add, you can add calculated fields. You see the available fields in the drop-down list or you can refer to them manually. Arithmetic and logical expressions, as well as built-in functions are available for the editor. 

5. (If primary data source contains parameters) On the Parameter tab, you can change the default type and default value for parameters like language, date, time and user. You can choose between Manual Default and System Default. 

6. (Optional) On the filter tab, you can define conditions to adjust the results set of a custom CDS view. When the custom CDS view is accessed, the result set will only contain the data that meets the defined conditions. 

7. You can either save a draft of your changes and publish if want to transport your changes. When you save a draft, the changes are only visible for you, but not other users.

8. (Optional) You can preview your custom CDS view. Note that aggregations are not visible in the preview.

9. After you have published your custom CDS view, you can transport it in the Transport Software Collection app.

