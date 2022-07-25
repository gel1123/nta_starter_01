#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

/**
 * デプロイするときのコマンド例：
 * yarn build && cdk deploy --all --require-approval never --profile PROFILE_NAME 
 * 
 * --allオプションについては後述。
 * --require-approvalオプションは、承認を必要とするかどうかを決める。
 * neverを指定することで、 yes or no の選択肢なしでデプロイできる。
 */
const app = new cdk.App();
new CdkStack(app, 'Nuxt3S3');