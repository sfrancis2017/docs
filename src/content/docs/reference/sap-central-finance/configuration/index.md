---
title: "Central Finance - CFIN"
description: "- SAP ERP system / NON-SAP system (source system)"
---
```
Central Finance - System Landscape
Central Finance - Configuration Steps
Central Finance - Target System Configuration
Central Finance - Source System Configuration

```
## CFIN projects involve multiple system landscapes:

- SAP ERP system / NON-SAP system (source system)
- SAP SLT – (This reads and replicates FICO documents. – It is the Glue that holds different systems together. It collects postings from different systems and directs to CFIN system. SLT is to move and synchronize data in real time).
- MDG (Optional)or the source system
- SAP S/4HANA System as CFIN system

SAP Recommends reading <a href="https://launchpad.support.sap.com/#/notes/2148893"><img alt="npm" src="https://img.shields.io/badge/SAP%20Note-2148893-blue"></a> and other associated and relevant notes before you start the Central Finance project to ensure identification of activities that are to be done in source and target systems, this in order to make sure that you have implemented all the SAP notes relevant to your scope of the project. Refer to <a href="https://launchpad.support.sap.com/#/notes/2323494"><img alt="npm" src="https://img.shields.io/badge/SAP%20Note-2323494-blue"></a> to get an overview of SAP notes relevant for source system. It is a collective.

## Maintain Authorizations:

The authorization SAP_IUUC_REPL_REMOTE has been assigned to the RFC user in the source system.
The following authorizations have been assigned to the configuration user in the SAP LT Replication Server
system:

- SAP_IUUC_REPL_ADMIN
- SAP_MWB_PROJECT_MANAGER

## Activate Business Functions:

Activate business function central finance (FINS_CFIN) (Refer to SAP Notes ). Activate it in the switch framework transaction SFW5 or SPRO.

![](/images/cfin1.png)

### AIF Runtime Configuration group assignment to replication object:

SAP Notes for SAP Application Interface Framework (Installation and Setup of AIF): <a href="https://launchpad.support.sap.com/#/notes/1530212"><img alt="npm" src="https://img.shields.io/badge/SAP%20Note-1530212-blue"></a>

In this Configuration step, define Application Interface Framework runtime configuration groups that you will be using to process data replicated to the Central Finance. A runtime configuration group in Application Interface Framework defines how Application Interface Framework messages relating to replication objects are processed. If no runtime configuration groups are defined in this screen, the data is processed using the default configuration, in which a separate background job is run for each Application Interface Framework message.

![](/images/cfin2.png)

## Configure Error Handling:

Error handlers should have access to SAP as well as access to AIF (transaction – /n/AIF/IFMON). This can be provided by adding user ID through (transaction – /n/AIF/RECIPIENTS).

### Interface Monitor

![](/images/cfininterface.png)

### Types of Errors

- Data Error – Master data missing in CFIN system
- Mapping error – Master data is present in source and CFIN system but not mapped
- Functional error – Related to configuration
- Technical error – Related to Database, memory, performance, SLT etc.

![](/images/cfinerror.png)

![](/images/cfinerror1.png)


## Assign AIF Runtime Configuration Group to Replication Object:

![](/images/cfin3.png)

## Setup RFC Destination for Source Systems:

In this configuration setup, define technical parameters for RFC destinations. These parameters are used for remote function calls (RFC) to other systems. RFC connection is required for reading data from the connected source systems to the Target system and to navigate to accounting documents in the source systems. Define and reuse the required RFC destinations of connection type 3 (ABAP Connection) for the following use cases:

- Extracting Data for Financial Accounting
- Extracting Data for Management Accounting
- Comparison Reports
- Central Payment
- Manage Mappings
- Displaying Objects from the Source System Using the Document Relationship Browser

![](/images/cfin4.png)

![](/images/cfin5.png)

Define RFC destination with Connection type 3. In Transaction Code : SM59 - Check Connection Sub nodes of the ABAP connection folder. Transaction Code BD54 to create logical system

![](/images/cfin6.png)

![](/images/cfin7.png)

On the SM59 screen, that is RFC of client 800 screen, select the technical settings tab and provide details such as:

```
Load balancing : NO
Target Host:
Instance:
IP address:

```
## Assign RFC Destination for Displaying Objects from Source System

![](/images/cfin8.png)


## Define Logical System for Source and Central Finance Systems:

Define one logical system for each connected source system client and one logical
system for the receiving Central Finance client. A logical system identifies the client of the connected
source systems in the accounting documents.

```
The name of the logical system must be the same in the source system and the Central Finance
system. SAP recommends that you use the following naming convention for logical systems:
<System ID> CLNT <Client Number>, for example Q91CLNT800.

```

Choose the logical source systems that you defined under Central Finance. Central Finance uses the logical systems defined in this activity to upload data from the corresponding source
systems.

```
Central Finance: Target System Settings --> Set Up Systems --> Define Logical System for Source and Central Finance
Systems

```

## Maintain RFC Assignments and Settings for Source Systems:

Make settings for the source systems and maintain RFC destinations for the source
systems (logical systems). These settings are used for remote function calls (RFC) from the Central
Finance system into the source system.


## Assign RFC Destination for Displaying Objects from Source Systems:

Assign RFC destinations to logical systems for each connected source system for
displaying objects from the source system.


For further detail, please refer the following link:

<a href="https://docs.sajivfrancis.com/#/./SAPCENTRALFINANCE/userassistance/index?id=configuration-guide"><img alt="npm" src="https://img.shields.io/badge/CFIN-CONFIGURATION%20GUIDE-red?style=for-the-badge&logo=appveyor"></a>