---
title: "Documents related to Databases"
description: "Commands:"
---
```
DOCS FOR Databases

```

Commands:

```
SAP HANA, Oracle, Postgresql, MySQL ...

```

## SAP HANA - Sample Stored Procedures and select queries.

### Stored Procedure in HANA
```
CREATE PROCEDURE MONTECARLO.RANDOM_DISTRIBUTION_BIN (OUT v_output
"MONTECARLO"."PAL_BINNING_RESULT_T")
LANGUAGE SQLScript READS SQL DATA WITH RESULT VIEW
MONTECARLO.BIN_DISTRIBUTION AS
BEGIN
input1= SELECT * from "MONTECARLO"."PAL_DISTRRANDOM_DISTRPARAM_TBL";
input2 = SELECT * FROM "MONTECARLO"."PAL_CONTROL_TBL_ANIL";
CALL "MONTECARLO"."DISTRRANDOM_PROC" (:input1, :input2, dis_inp);
bin_input = SELECT "ID", "RANDOM" AS "VAR" FROM :dis_inp;
control_input = SELECT * FROM "MONTECARLO"."BIN_PAL_CONTROL_TBL";
CALL "MONTECARLO"."BINNING_VAR_PROC"(:bin_input, :control_input,
v_output);
END;
```
### Select Query in HANA (from stored procedure)
```
select round(AVG(A_R),6), round(STDDEV(A_R),6), count(*),
round(STDDEV(A_R)/sqrt(count(*)),6)
into drift_of_return, stddev_of_return, number_of_time_steps, dt
from (
select DATE_SQL, SUM(DAILY_RETURN*WEIGHT) A_R
from "_SYS_BIC"."montecarlo/AN_STOCK_RETURN"
where ID = :PORTF_ID
and DATE_SQL between :BEGIN_DATE and :END_DATE
group by DATE_SQL
);
TOPROWS := TIME_STEPS * SERIES;
input1 = SELECT * FROM MONTECARLO.PAL_DISTRRANDOM_DISTRPARAM_TBL;

input2 = SELECT * FROM MONTECARLO.PAL_CONTROL_TBL
union
select 'NUM_RANDOM', :TIME_STEPS, null, null from dummy ;
for k in 1 .. :SERIES do
CALL MONTECARLO.DISTRRANDOM_PROC(:input1, :input2, v_output);
eps_list = select top :TIME_STEPS "ID" as row_id, RANDOM as eps from :v_output;
insert into MONTECARLO.SIM_LOOP_WORK_TEMP select :k, 0, :INIT_RETURN, :INIT_RETURN,
0 from dummy;
select 0,0 into t,W from dummy;
for i in 1 .. :TIME_STEPS do
select eps into eps from :eps_list where row_id = :i-1;
dW := stddev_of_return*eps*sqrt(dt);
t := dt*i;
W := W + dW;
insert into MONTECARLO.SIM_LOOP_WORK_TEMP
select top 1 :k, :i, RETURN_+RETURN_*(:drift_of_return*:dt+:dW),

(RETURN_2+RETURN_2*(:drift_of_return*:dt+:dW))*exp((:drift_of_return*t-
0.5*:stddev_of_return*:stddev_of_return*:t) + :W),

0 from MONTECARLO.SIM_LOOP_WORK_TEMP where SERIES = :k order by TIME_STEPS

desc;
end for;
end for;
```
### Sample - Regression - MLR

```
SET SCHEMA DM_PAL;

DROP TABLE #PAL_PARAMETER_TBL;
CREATE LOCAL TEMPORARY COLUMN TABLE 
	#PAL_PARAMETER_TBL 
	("PARAM_NAME" VARCHAR(256), "INT_VALUE" INTEGER, "DOUBLE_VALUE" DOUBLE, "STRING_VALUE" VARCHAR(1000));
INSERT INTO #PAL_PARAMETER_TBL VALUES ('ALG', 6, NULL, NULL);
INSERT INTO #PAL_PARAMETER_TBL VALUES ('ENET_LAMBDA', NULL, 0.003194, NULL);
INSERT INTO #PAL_PARAMETER_TBL VALUES ('ENET_ALPHA', NULL, 0.95, NULL);

DROP TABLE PAL_ENET_MLR_DATA_TBL;
CREATE COLUMN TABLE PAL_ENET_MLR_DATA_TBL ( "ID" INT,"Y" DOUBLE,"V1" DOUBLE,"V2" DOUBLE,"V3" DOUBLE);
INSERT INTO PAL_ENET_MLR_DATA_TBL VALUES (0, 1.2, 0.1, 0.205, 0.9);
INSERT INTO PAL_ENET_MLR_DATA_TBL VALUES (1, 0.2, -1.705, -3.4, 1.7);
INSERT INTO PAL_ENET_MLR_DATA_TBL VALUES (2, 1.1, 0.4, 0.8, 0.5);
INSERT INTO PAL_ENET_MLR_DATA_TBL VALUES (3, 1.1, 0.1, 0.201, 0.8);
INSERT INTO PAL_ENET_MLR_DATA_TBL VALUES (4, 0.3, -0.306, -0.6, 0.2);

DROP TABLE PAL_FMLR_COEFICIENT_TBL;
CREATE COLUMN TABLE PAL_FMLR_COEFICIENT_TBL ("Coefficient" varchar(1000), "CoefficientValue" DOUBLE, "T_VALUE" DOUBLE, "P_VALUE" DOUBLE);

CALL _SYS_AFL.PAL_LINEAR_REGRESSION(PAL_ENET_MLR_DATA_TBL,"#PAL_PARAMETER_TBL", PAL_FMLR_COEFICIENT_TBL, ?, ?,?,? ) WITH OVERVIEW;
SELECT * FROM PAL_FMLR_COEFICIENT_TBL;

DROP TABLE #PAL_PARAMETER_TBL;
CREATE LOCAL TEMPORARY COLUMN TABLE 
	#PAL_PARAMETER_TBL 
	("PARAM_NAME" VARCHAR(256), "INT_VALUE" INTEGER, "DOUBLE_VALUE" DOUBLE, "STRING_VALUE" VARCHAR(1000));
INSERT INTO #PAL_PARAMETER_TBL VALUES ('THREAD_RATIO',NULL,0.1,NULL);

DROP TABLE PAL_FMLR_PREDICTDATA_TBL;
CREATE COLUMN TABLE PAL_FMLR_PREDICTDATA_TBL("ID" INT, "V1" DOUBLE, "V2" DOUBLE, "V3" DOUBLE);
INSERT INTO PAL_FMLR_PREDICTDATA_TBL VALUES (1, 0.5, 0.41, 0.8);
INSERT INTO PAL_FMLR_PREDICTDATA_TBL VALUES (2, 0.2, 0.29, 0.2);
INSERT INTO PAL_FMLR_PREDICTDATA_TBL VALUES (3, -0.721, -0.27, 0.5);

CALL _SYS_AFL.PAL_LINEAR_REGRESSION_PREDICT(PAL_FMLR_PREDICTDATA_TBL, PAL_FMLR_COEFICIENT_TBL, "#PAL_PARAMETER_TBL", ?);

```

### Stored Procedure in Oracle
```
-- STORED PROCEDURE FOR ARTAX
CREATE OR REPLACE PROCEDURE AR_TAXTEST AS
    CURSOR main_cur IS
    SELECT * FROM sapsr3.zar_inv_source
    WHERE inventory_item = 'AR_TAX';
BEGIN
    FOR mc IN main_cur LOOP
    UPDATE ARTAX
    SET
        inv_tax = mc.unit_price,
        inv_amt = srcinvamt - nvl(mc.unit_price,0)
    WHERE
        vbrpbilldoc = mc.bill_doc;
    END LOOP;
    COMMIT;

    UPDATE ARTAX
    SET
        inv_amt = srcinvamt where inv_tax = 0;
END AR_TAXTEST;
/

SHOW ERROR
-- INDEX FOR TABLE ARTAX
CREATE INDEX ARTAX_n1 ON
    ARTAX (
        vbrpbilldoc
    );
-- Execute the stored procedure AR_TAXTEST
exec AR_TAXTEST;
```
### Select Query in Oracle
```
SELECT 'REC'                      CODE,
         A.CPUDT,
         A.MANDT,
         E.WERKS                    RECEIVINGPLANT,
         e.bukrs                    ReceivingCompanycode,
                 B.WERKS   SHIPPINGPLANT,                       --Receivable Plant
         A.KUNNR,
         D.NAME1,
         D.NAME2,
         A.BUKRS,
         A.BELNR,
         A.GJAHR,
         A.BLART,
         C.FKDAT                    BILLINGDOCDATE,
        -- C.NETWR                    DOCTOTAL,          --Total of the document
         A.SHKZG,
         A.WRBTR                   DOCTOTAL,          --Total of the document
         B.AUBEL                    EBELN,                         --PO Number
         SUBSTR (B.AUPOS, 2, 5)     EBELP,                    --po Line Number
         B.MATNR                    PARTNUMBER,
         B.ARKTX                    PARTDESC,
         B.FKIMG                    QTYINV,
         B.VRKME                    UOM,
         B.NETWR                    EXTAMT
    FROM SAPSR3.BSID A                                      --Open AR Invoices
         JOIN SAPSR3.VBRP B                               --Billing Doc Detail
             ON     A.MANDT = B.MANDT
                AND A.BELNR = B.VBELN
                AND A.BUKRS = VKORG_AUFT
         JOIN SAPSR3.VBRK C ON B.MANDT = C.MANDT AND B.VBELN = C.VBELN --Billing Doc Header
         JOIN SAPSR3.KNA1 D ON A.MANDT = D.MANDT AND A.KUNNR = D.KUNNR --customer Table
         JOIN SAPSR3.EKPO E
             ON     B.MANDT = E.MANDT
                AND B.AUBEL = E.EBELN
                AND SUBSTR (B.AUPOS, 2, 5) = EBELP
   WHERE A.MANDT = '285'                                              --Client
                         AND B.VSTEL = '9000'            --Receivable Location
--and b.aubel = '4500034174'
ORDER BY A.CPUDT DESC, A.BELNR, B.AUPOS;

```
### DDL SQL statements

```
CREATE TABLE canadahstrates (
    province            VARCHAR(20) NOT NULL,
    provcode            VARCHAR(2) NOT NULL,
    gst                 DECIMAL(5, 5) NOT NULL,
    pst                 DECIMAL(5, 5) NOT NULL,
    hst                 DECIMAL(5, 5) NOT NULL,
    provincialtaxinfo   VARCHAR(30) NOT NULL,
    CONSTRAINT provcode_pk PRIMARY KEY ( provcode )
)
    STORAGE ( INITIAL 50K );

--Insert into table CANADAHSTRATES
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Alberta','AB',0.05,0.00,0.05,'Alberta Tax and Revenue Administration');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('British Columbia','BC',0.05,0.07,0.12,'BC Consumer Taxes');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Manitoba','MB',0.05,0.07,0.12,'Manitoba Retail Sales Tax');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('New Brunswich','NB',0.05,0.10,0.15,'New Brunswick Taxes');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Newfoundland','NL',0.05,0.10,0.15,'Taxes in Newfoundland and Labrador');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('NWT','NWT',0.05,0.00,0.05,'North West Territories Taxes');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Nova Scotia','NS',0.05,0.10,0.15,'Novo Scotia Taxpayers');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Nunavut','NU',0.05,0.00,0.05,'Nunavut Taxes');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Ontario','ON',0.05,0.08,0.13,'Ontario HST');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('PEI','PE',0.05,0.10,0.15,'PEI HST');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Quebec','QC',0.05,0.09975,0.14975,'Quebec GST and QST');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Saskatchewan','SK',0.05,0.06,0.11,'Saskatchewan Taxes');
    INSERT INTO canadahstrates (province,provcode,gst,pst,hst,provincialtaxinfo) VALUES ('Yukon','YK',0.05,0.00,0.05,'Yukon Taxation');

```
