using System.Text.Json.Serialization;

namespace EmailDraft
{
    public class EmailFile
    {
        [JsonPropertyName("path")]
        public string? path { get; set; } = "";

        [JsonPropertyName("recipient")]
        public string? recipient { get; set; } = "";
    }

    public class EmailProcessRequest
    {
        [JsonPropertyName("emlFiles")]
        public List<EmailFile> EmlFiles { get; set; } = new();
    }

}
