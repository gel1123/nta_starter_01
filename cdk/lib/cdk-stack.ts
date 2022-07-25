import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AllowedMethods, Distribution, OriginProtocolPolicy, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { PolicyStatement, Effect, ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uuid = 'b32c5227-6b77-4dba-894a-cf18d109a53a';

    // S3 Web Hosting
    const bucket = new Bucket(this, `${id}_Bucket`, {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.DENY,
      actions: ['s3:GetObject'],
      principals: [new ArnPrincipal('*')],
      resources: [bucket.bucketArn + '/*'],
      conditions: {
        StringNotLike: {
          'aws:Referer': uuid
        }
      },
    }));
    const cdn = new Distribution(this, `${id}_CDN`, {
      priceClass: PriceClass.PRICE_CLASS_200, // 価格クラスは200から日本を含むようになる
      defaultBehavior: {
        // S3 Web Hosting Endpoint をオリジンとしたいので、S3Origin ではなく、HttpOrigin を使う。
        origin: new HttpOrigin(bucket.bucketWebsiteDomainName, {
          customHeaders: {Referer: uuid},
          originPath: '/',
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS, // 今回は静的サイトのホスティングのみなので
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
    });

    // Nuxt3アプリケーションの資材はCDKデプロイ実行前に生成済みである前提
    new BucketDeployment(this, `${id}_BucketDeployment`, {
      sources: [Source.asset('../nuxt3/.output/public')],
      destinationBucket: bucket,
      distribution: cdn, // distribution属性に指定すると、デプロイ後にキャッシュをクリアしてくれる
    });
    new CfnOutput(this, `${id}_CDN_URL`, {value: `https://${cdn.distributionDomainName}`});
  }
}
