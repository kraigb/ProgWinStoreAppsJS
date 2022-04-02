using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;

public partial class sendBadgeToWNS : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        //Load our data that was previously saved. A real service would do a database lookup here
        //with user- or tile-specific criteria.
        string loadLocation = Server.MapPath(".") + "\\" + "channeldata_aspx.txt";
        byte[] dataBytes;
        
        using (System.IO.FileStream fs = new System.IO.FileStream(loadLocation, System.IO.FileMode.Open))
        {
            dataBytes = new byte[fs.Length];
            fs.Read(dataBytes, 0, dataBytes.Length);            
        }

        if (dataBytes.Length == 0)
        {
            return;
        }
        
        System.Text.ASCIIEncoding encoding = new System.Text.ASCIIEncoding();

        string data = encoding.GetString(dataBytes);
        string[] values = data.Split(new Char[] { '~' });
        string uri = values[0]; //Channel URI 
       
        //These values won't work to authenticate with WNS: register the sample with your own Store account
        //and replace these with the values from the dashboard. 
        string secret = "9ttsZT0JgHAFveYahK1B6jQbvMOIWYbm";
        string sid = "ms-app://s-1-15-2-2676450768-845737348-110814325-22306146-1119600341-293560589-2707026538";
        
        //Check that you've replaced the unusable values above with your own.
        if (secret == "9ttsZT0JgHAFveYahK1B6jQbvMOIWYbm" || 
            sid == "ms-app://s-1-15-2-2676450768-845737348-110814325-22306146-1119600341-293560589-2707026538")
        {
            throw new Exception("You need to replace the client secret and SID with your own values.");
        }

        
        //Create some simple XML for a badge update
        string xml = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>";
        xml += "<badge value='alert'/>";
                    
        PostToWns(secret, sid, uri, xml, "wns/badge");
    }


    //This code is taken from http://msdn.microsoft.com/en-us/library/windows/apps/xaml/hh868252.aspx

    // Post to WNS
    public string PostToWns(string secret, string sid, string uri, string xml, string type = "wns/badge")
    {
        try
        {
            // You should cache this access token
            var accessToken = GetAccessToken(secret, sid);

            byte[] contentInBytes = Encoding.UTF8.GetBytes(xml);

            HttpWebRequest request = HttpWebRequest.Create(uri) as HttpWebRequest;
            request.Method = "POST";
            request.Headers.Add("X-WNS-Type", type);
            request.Headers.Add("Authorization", String.Format("Bearer {0}", accessToken.AccessToken));

            using (Stream requestStream = request.GetRequestStream())
                requestStream.Write(contentInBytes, 0, contentInBytes.Length);

            using (HttpWebResponse webResponse = (HttpWebResponse)request.GetResponse())
                return webResponse.StatusCode.ToString();
        }
        catch (WebException webException)
        {
            string exceptionDetails = webException.Response.Headers["WWW-Authenticate"];
            if (exceptionDetails.Contains("Token expired"))
            {
                GetAccessToken(secret, sid);

                // Implement a maximum retry policy
                return PostToWns(uri, xml, secret, sid, type);
            }
            else
            {
                // Log the response
                return "EXCEPTION: " + webException.Message;
            }
        }
        catch (Exception ex)
        {
            return "EXCEPTION: " + ex.Message;
        }
    }

    // Authorization
    [DataContract]
    public class OAuthToken
    {
        [DataMember(Name = "access_token")]
        public string AccessToken { get; set; }
        [DataMember(Name = "token_type")]
        public string TokenType { get; set; }
    }

    private OAuthToken GetOAuthTokenFromJson(string jsonString)
    {
        using (var ms = new MemoryStream(Encoding.Unicode.GetBytes(jsonString)))
        {
            var ser = new DataContractJsonSerializer(typeof(OAuthToken));
            var oAuthToken = (OAuthToken)ser.ReadObject(ms);
            return oAuthToken;
        }
    }

    protected OAuthToken GetAccessToken(string secret, string sid)
    {
        var urlEncodedSecret = HttpUtility.UrlEncode(secret);
        var urlEncodedSid = HttpUtility.UrlEncode(sid);

        var body = String.Format("grant_type=client_credentials&client_id={0}&client_secret={1}&scope=notify.windows.com",
                                 urlEncodedSid,
                                 urlEncodedSecret);

        string response;
        using (var client = new WebClient())
        {
            client.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
            response = client.UploadString("https://login.live.com/accesstoken.srf", body);
        }
        return GetOAuthTokenFromJson(response);
    }
}