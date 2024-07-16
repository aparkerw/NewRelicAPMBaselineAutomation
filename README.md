# APM Observability Standardization Automation

## Overview

The purpose of this project is to provide a standard implementation for alerts and dashboard creation.

Executing this script for each APM instance in your account will ensure that any standardized alerting and dashboard governance policies are applied.

This script is idempotent and will only create resources that haven't been created or have otherwise been removed.

Note the use of tagging for these resources.  Particularly the `BASLEINE=true` tag applied to items created within.

Likewise the APM entity that this is executed upon will have the following tags added to it for the purposes of auditing and cross linking.

- `BASELINE_DASHBOARD_CREATED={date_of_creation}`
- `BASELINE_DASHBOARD_GUID={GUID_of_dashboard}`
- `BASELINE_WORKFLOW_CREATED={date_of_creation}`
- `BASELINE_WORKFLOW_GUID={GUID_of_workflow}`

## Graphql

### Description

Graphql is the most flexible option for creating resources withing New Relic and it allows us to fully control the logic for handling existing resources.

The **Node JS** script in `app.js` will use the provided environment variables to then lookup and create the additional alerting and dashboard resources.

#### Results

When the script executes it will create the following artifacts if they do not exist:

- Dashboards: dashboard with desired pages/widgets
- Alerts: destination for the provided email
- Alerts: channel for the destination
- Alerts: alert policy with incident handeling rules
- Alerts: alert condition(s) that will be added to the policy
- Alerts: alert workflow that links the channel and the alert policy

### Running the script

#### Inputs

To properly run the script you will need to provide the following information either in a `.env` file or as an `Envoronment Variable`

- **API Key**
- **APM Name**
- **New Relic Account ID**
- **Alert Email Address**

*example `.env`file*
```
NR_API_KEY="NRAK-L*******************5"
NR_APP_NAME="Account Management Service"
NR_ACCOUNT_ID="1234567"
NR_ALERT_EMAIL="your_email@email.com"
```

#### Outputs

The logs will display information about the skipping or creating of resources.
Likewise, the IDs and GUIDs for the resulting artifacts will be shown in the logs.

Here is an example output:

```
The baseline dashboard appears to already exist. MzkxNDk2M****zQ4MzQ
creating the baseline dashboard was not successful Dashboard already exists...aborting.
destinationId 2856b**-****-****9a2a26ea
channelId 04fc90b4-****-0b7af513a3b8
skipping policy creation because matching policy already exists: 54***73
policyId 5465973
condition being skipped hosts check 111***11
condition being skipped hosts check 2 222***22
conditionIds 
skipping workflow creation because matching workflow already exists: MzkxNDk2MnxBS***TcwMC1hNTFhNTllY2YyYzM
workflowId MzkxNDk2MnxBS***TcwMC1hNTFhNTllY2YyYzM
```

#### Logic

## Terraform
