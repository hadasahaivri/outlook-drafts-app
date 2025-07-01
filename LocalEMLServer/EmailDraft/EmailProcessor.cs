using System.Diagnostics;
using System.Net;
using System.Text.Json;

namespace EmailDraft
{
    public static class EmailProcessor
    {
        public static void HandleProcessEmails(HttpListenerRequest request, HttpListenerResponse response)
        {
            try
            {
                using var reader = new StreamReader(request.InputStream, request.ContentEncoding);
                string json = reader.ReadToEnd();

                Console.WriteLine($"[RECEIVED JSON]: {json}");

                var data = JsonSerializer.Deserialize<EmailProcessRequest>(json);

                if (data?.EmlFiles == null || data.EmlFiles.Count == 0)
                {
                    RespondError(response, 400, "No EML files provided");
                    return;
                }

                int successCount = 0;
                foreach (var emlFile in data.EmlFiles)
                {
                    try
                    {
                        OpenOutlookWithEML(emlFile.path ?? "");
                        successCount++;
                        Thread.Sleep(500);
                    }
                    catch
                    {
                        // אפשר ללוג
                    }
                }

                RespondJson(response, 200, new
                {
                    success = true,
                    message = $"Outlook opened with {successCount} EML files",
                    processedFiles = successCount
                });
            }
            catch (Exception ex)
            {
                RespondJson(response, 500, new
                {
                    success = false,
                    error = ex.Message
                });
            }
        }

        private static void OpenOutlookWithEML(string emlFilePath)
        {
            if (string.IsNullOrWhiteSpace(emlFilePath) || !File.Exists(emlFilePath))
                throw new FileNotFoundException($"EML file not found: {emlFilePath}");

            var processInfo = new ProcessStartInfo
            {
                FileName = emlFilePath,
                UseShellExecute = true
            };

            Process.Start(processInfo);
        }

        private static void RespondError(HttpListenerResponse response, int statusCode, string message)
        {
            RespondJson(response, statusCode, new { error = message });
        }

        private static void RespondJson(HttpListenerResponse response, int statusCode, object data)
        {
            response.StatusCode = statusCode;
            response.Headers.Add("Content-Type", "application/json");
            using var writer = new StreamWriter(response.OutputStream);
            writer.Write(JsonSerializer.Serialize(data));
            response.Close();
        }
    }

}
