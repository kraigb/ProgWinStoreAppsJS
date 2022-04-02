<%@ Page Language="C#" AutoEventWireup="true" %>

<script runat="server">

protected void Page_Load(object sender, EventArgs e)
{
    //Output page header
    Response.Write("<!DOCTYPE html>\n<head>\n<title>Register Channel URI</title>\n</head>\n<html>\n<body>");
    
    //If called with HTTP GET (as from a browser), just show a message.
    if (Request.HttpMethod == "GET")
    {
        Response.Write("<p>This page is set up to receive channel URIs from a push notification client app.</p>");
        Response.Write("</body></html>");
        return;
    }

    //Otherwise assume a POST and check for parameters    
    try
    {
        //channelUri and itemId are the values posted from the Push and Periodic Notifications Sample in the Windows 8 SDK
        if (Request.Params["channelUri"] != null && Request.Params["itemId"] != null)
        {
            // Obtain the values, along with the user string
            string uri = Request.Params["channelUri"];
            string itemId = Request.Params["itemId"];
            string user = Request.Params["LOGON_USER"];
                 
            //Output in response
            Response.Write("<p>Saved channel data:</p><p>channelUri = " + uri + "<br/>" + "itemId = " + itemId + "user = " + user + "</p>");

            //
            //The service should save the URI and itemId here, along with any other unique data from the app such as the user;
            //Typically this would be saved to a database of some kind; to keep this demonstration very simple, we'll just use
            //the complete hack of writing the data to a file, paying no need to overwriting previous data.            
            //
            
            //If running in the debugger on localhost, this will save to the project folder
            string saveLocation = Server.MapPath(".") + "\\" + "channeldata_aspx.txt";
            string data = uri + "~" + itemId + "~" + user;
                        
            System.Text.ASCIIEncoding encoding = new System.Text.ASCIIEncoding();
            byte[] dataBytes = encoding.GetBytes(data);
            
            using (System.IO.FileStream fs = new System.IO.FileStream(saveLocation, System.IO.FileMode.Create))
            {
                fs.Write(dataBytes, 0, data.Length);
            }

            Response.Write("</body></html>");
        }
    }
    catch (Exception ex)
    {
        Trace.Write(ex.Message);
        Response.StatusCode = 500;
        Response.StatusDescription = ex.Message;        
        Response.End();
    }
}
</script>
