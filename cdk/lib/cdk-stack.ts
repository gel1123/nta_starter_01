import { CfnOutput, PhysicalName, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AllowedMethods, Distribution, Function, FunctionCode, FunctionEventType, OriginBase, OriginProtocolPolicy, OriginRequestPolicy, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { EdgeFunction } from 'aws-cdk-lib/aws-cloudfront/lib/experimental';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uuid = 'b32c5227-6b77-4dba-894a-cf18d109a53a';

    // S3 Web Hosting
    const bucket = new Bucket(this, `${id}_Bucket`, {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,

      /**
       * AWSマネジメントコンソールにおける
       * Amazon S3 > バケット > [バケット名] > 静的ウェブサイトホスティングを編集
       * の下記「リダイレクトルール」に相当。
       * 
       * ```
       * [
       *     {
       *         "Condition": {
       *             "HttpErrorCodeReturnedEquals": "404"
       *         },
       *         "Redirect": {
       *             "ReplaceKeyWith": ""
       *         }
       *     }
       * ]
       * ```
       * 
       * だが、CloudFrontに組み込む場合、このリダイレクトの仕組みが逆効果になる。
       * 具体的にはリダイレクト発動時に、CloudFrontのURLではなく、
       * S3のURLが返されてしまう。
       * そのためこれをコメントアウトしている。
       */
      // websiteRoutingRules: [{
      //   condition: {
      //     httpErrorCodeReturnedEquals: '404'
      //   },
      //   replaceKey: {
      //     withKey: ''
      //   }
      // }]
    });
    // bucket.addToResourcePolicy(new PolicyStatement({
    //   effect: Effect.DENY,
    //   actions: ['s3:GetObject'],
    //   principals: [new ArnPrincipal('*')],
    //   resources: [bucket.bucketArn + '/*'],
    //   conditions: {
    //     StringNotLike: {
    //       'aws:Referer': uuid
    //     }
    //   },
    // }));
    const cdn = new Distribution(this, `${id}_CDN`, {
      priceClass: PriceClass.PRICE_CLASS_200, // 価格クラスは200から日本を含むようになる
      // errorResponses: [{
      //   // S3 Web Hosting のリダイレクトルールの代わりに、
      //   // CloudFrontのリダイレクトルールを使う。
      //   // ...というつもりだったが、実際にはURLとしてのリダイレクトは行われず、
      //   // SPAとしてNuxt3がエラーページと通常ページを混在させたページを返すようになってしまうため、
      //   // これは使わない。
      //   httpStatus: 404,
      //   responseHttpStatus: 302,
      //   responsePagePath: '/',
      // }],
      defaultBehavior: {
        // S3 Web Hosting Endpoint をオリジンとしたいので、S3Origin ではなく、HttpOrigin を使う。
        origin: new HttpOrigin(bucket.bucketWebsiteDomainName, {
          customHeaders: {Referer: uuid},
          originPath: '/',
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS, // 今回は静的サイトのホスティングのみなので
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,

        // ALL_VIEWERS は、hostヘッダがオリジンの静的ホストS3エンドポイントに送られることで、
        // `The specified bucket does not exist` エラーが発生する。
        // （CloudFrontのディストリビューション名をバケット名と誤認されてしまう）
        // このため、ALL_VIEWERS は使用できない。
        // https://alestic.com/2017/03/cloudfront-s3-host-header/
        // originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,

        functionAssociations: [{
          eventType: FunctionEventType.VIEWER_RESPONSE,
          function: new Function(this, `${id}_CdnFunc`, {
            code: FunctionCode.fromFile({
              filePath: './lib/redirect.js',
            }),
          })
        }],
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
