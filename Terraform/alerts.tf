# # https://registry.terraform.io/providers/newrelic/newrelic/latest/docs/resources/alert_channel
# resource "newrelic_alert_channel" "benchmark_email_channel" {
#   name = "benchmark - email"
#   type = "email"

#   config {
#     recipients              = var.nr_alert_email
#     include_json_attachment = "1"
#     tags = "benchmark:true"
#   }
# }

# # https://registry.terraform.io/providers/newrelic/newrelic/latest/docs/resources/alert_policy
# resource "newrelic_alert_policy" "benchmark_policy" {
#   name  = "Benchmark Alert Policy - ${data.newrelic_entity.my_host.name}"
#   incident_preference = "PER_POLICY"
# }


# # https://registry.terraform.io/providers/newrelic/newrelic/latest/docs/resources/alert_condition
# resource "newrelic_alert_condition" "benchmark_alert_condition" {
#   policy_id = newrelic_alert_policy.benchmark_policy.id

#   name        = "Benchmark Alert Condition - ${data.newrelic_entity.my_host.name}"
#   type        = "apm_app_metric"
#   entities    = [data.newrelic_entity.app.application_id]
#   metric      = "host.cpuPercent"
#   # runbook_url = "https://www.example.com"
#   condition_scope = "application"

#   term {
#     duration      = 5
#     operator      = "above"
#     priority      = "critical"
#     threshold     = "80"
#     time_function = "all"
#   }
# }