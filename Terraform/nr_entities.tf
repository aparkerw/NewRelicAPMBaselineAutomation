# https://registry.terraform.io/providers/newrelic/newrelic/latest/docs/data-sources/entity
# data "newrelic_entity" "server" {
#   name = var.nr_host_name # Must be an exact match to your application name in New Relic
#   domain = "INFRA" # or BROWSER, INFRA, MOBILE, SYNTH, depending on your entity's domain
#   type = "APPLICATION"
# }

data "newrelic_entity" "app" {
  name = var.nr_app_name # Must be an exact match to your application name in New Relic
  domain = "APM" # or BROWSER, INFRA, MOBILE, SYNTH, depending on your entity's domain
  type = "APPLICATION"
}