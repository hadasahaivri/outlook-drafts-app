using System.Net;
using System.Text.Json;

namespace EmailDraft
{
    public class EmailDraftServer
    {
        public void Start()
        {
            var listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:5097/");
            listener.Start();
            Console.WriteLine("Listening on http://localhost:5097/");

            while (true)
            {
                var context = listener.GetContext();
                HandleRequest(context);
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;

            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Accept, User-Agent");

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 204;
                response.Close();
                return;
            }

            switch (request.Url?.AbsolutePath)
            {
                case "/process-emails" when request.HttpMethod == "POST":
                    EmailProcessor.HandleProcessEmails(request, response);
                    break;

                case "/status" when request.HttpMethod == "GET":
                    RespondJson(response, 200, new { status = "ok", message = "Local app is running" });
                    break;

                case "/" when request.HttpMethod == "GET":
                    RespondJson(response, 200, new { service = "EmailDraft Local App", version = "1.0", status = "running" });
                    break;

                default:
                    response.StatusCode = (request.HttpMethod == "GET") ? 404 : 405;
                    // סובב את המשתנה using var בבלוק כדי למנוע את השגיאה
                    {
                        using var writer = new StreamWriter(response.OutputStream);
                        writer.Write((request.HttpMethod == "GET") ? "Not Found" : "Method Not Allowed");
                    }
                    response.Close();
                    break;
            }
        }


        private void RespondJson(HttpListenerResponse response, int statusCode, object data)
        {
            response.StatusCode = statusCode;
            response.Headers.Add("Content-Type", "application/json");
            using var writer = new StreamWriter(response.OutputStream);
            writer.Write(JsonSerializer.Serialize(data));
            response.Close();
        }
    }

}
