# Terraform State Backup Strategy

This document outlines the backup and recovery strategy for Terraform state files in the EventMaster project.

## Current State Configuration

The Terraform state is stored in AWS S3 with the following configuration:

```hcl
terraform {
  backend "s3" {
    bucket         = "eventmaster-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "eventmaster-terraform-locks"
  }
}
```

## Built-in Protections

### S3 Versioning

S3 bucket versioning is enabled, which:
- Automatically keeps all previous versions of the state file
- Allows recovery from accidental deletions or corruptions
- Provides point-in-time recovery capability

### State Locking

DynamoDB table is used for state locking to:
- Prevent concurrent modifications
- Avoid state corruption from parallel operations

### Server-Side Encryption

State files are encrypted at rest using:
- S3 Server-Side Encryption (SSE-S3 or SSE-KMS)
- Protects sensitive infrastructure data

## Backup Procedures

### Automatic Backups (via S3 Versioning)

Every `terraform apply` automatically creates a new version of the state file.

**To list previous versions:**
```bash
aws s3api list-object-versions \
  --bucket eventmaster-terraform-state \
  --prefix dev/terraform.tfstate
```

**To restore a previous version:**
```bash
# Get the version ID from the list above
aws s3api get-object \
  --bucket eventmaster-terraform-state \
  --key dev/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.backup

# Review the backup before restoring
# If confirmed, push the backup as current state
aws s3 cp terraform.tfstate.backup s3://eventmaster-terraform-state/dev/terraform.tfstate
```

### Manual Backups (Before Major Changes)

Before major infrastructure changes, create a manual backup:

```bash
# Navigate to environment
cd infra/terraform/environments/dev

# Pull current state
terraform state pull > terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)

# Store backup in a secure location
aws s3 cp terraform.tfstate.backup.* s3://eventmaster-terraform-state/backups/
```

### Cross-Region Backup (Recommended for Production)

For production environments, enable S3 Cross-Region Replication:

1. Create a backup bucket in another region
2. Enable CRR from the primary state bucket
3. Configure lifecycle policies for backup retention

## Recovery Procedures

### Recovering from Corrupted State

1. **Identify the issue:**
   ```bash
   terraform state list
   terraform validate
   ```

2. **Restore from S3 version:**
   ```bash
   # List versions
   aws s3api list-object-versions \
     --bucket eventmaster-terraform-state \
     --prefix dev/terraform.tfstate

   # Download the last known good version
   aws s3api get-object \
     --bucket eventmaster-terraform-state \
     --key dev/terraform.tfstate \
     --version-id <GOOD_VERSION_ID> \
     ./recovered-state.tfstate

   # Push recovered state
   terraform state push ./recovered-state.tfstate
   ```

3. **Verify recovery:**
   ```bash
   terraform plan
   ```

### Recovering from Deleted State

If the state file is accidentally deleted:

1. **Check S3 versioning for delete markers:**
   ```bash
   aws s3api list-object-versions \
     --bucket eventmaster-terraform-state \
     --prefix dev/terraform.tfstate
   ```

2. **Remove delete marker to restore:**
   ```bash
   aws s3api delete-object \
     --bucket eventmaster-terraform-state \
     --key dev/terraform.tfstate \
     --version-id <DELETE_MARKER_VERSION_ID>
   ```

### Rebuilding State from Existing Infrastructure

If state cannot be recovered:

1. **Initialize with empty state:**
   ```bash
   terraform init -reconfigure
   ```

2. **Import existing resources:**
   ```bash
   # Import each resource
   terraform import module.vpc.aws_vpc.main vpc-xxxxx
   terraform import module.ecs.aws_ecs_cluster.main arn:aws:ecs:...
   # Continue for all resources
   ```

3. **Verify imported state:**
   ```bash
   terraform plan
   # Should show no changes if import was complete
   ```

## Monitoring and Alerts

### S3 Access Logging

Enable S3 access logging to track state file access:

```hcl
resource "aws_s3_bucket_logging" "state_logging" {
  bucket = "eventmaster-terraform-state"

  target_bucket = "eventmaster-logs"
  target_prefix = "terraform-state-logs/"
}
```

### CloudWatch Alerts (Optional)

Set up alerts for:
- Unusual state file access patterns
- Failed S3 operations
- DynamoDB throttling

## Best Practices

1. **Never manually edit state files** - Use `terraform state` commands instead
2. **Always run `terraform plan` before `terraform apply`**
3. **Create manual backups before destructive operations**
4. **Use workspaces or separate state files for different environments**
5. **Restrict S3 bucket access with IAM policies**
6. **Enable MFA Delete on S3 bucket for production**
7. **Regularly test state recovery procedures**

## Related Documentation

- [Terraform Backend Configuration](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [Terraform State Recovery](https://developer.hashicorp.com/terraform/cli/state/recover)
