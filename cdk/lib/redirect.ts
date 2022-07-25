// https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-features.html
function handler(event: AWSCloudFrontFunction.Event): AWSCloudFrontFunction.Response {
  
  if (!event.response.headers) event.response.headers = {};
  event.response.headers.cfn = {value: '1'};
  // CloudFront Functions では const 使用不可。そのほかも制限あり。
  if (event.response.statusCode !== 302) return event.response;
  // `/` のみでは S3 Web Hosting 側のエンドポイントにリダイレクトしてしまう
  // event.response.headers.location = {value: `https://${event.response.headers.host.value}/`};
  event.response.headers.location = {value: `https://${event.request.headers.host.value}/`};
  return event.response;
}