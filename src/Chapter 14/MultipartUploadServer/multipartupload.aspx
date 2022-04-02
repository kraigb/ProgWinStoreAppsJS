<%@ Page Language="C#" AutoEventWireup="true" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<script runat="server">
    
protected void Page_Load(object sender, EventArgs e)
{
    try
    {
        //Accept an upload from the MultipartUpload Example and write the response to a file
        if (Request.Headers["Content-Type"] != null)        
        {
            if (Request.Headers["Content-Type"].Substring(0, 19) == "multipart/form-data")
            {                
                long length = Request.InputStream.Length;
                byte[] content = new byte[length];

                //Write to a file
                string saveLocation = Server.MapPath("multipart-request.txt");
                
                using (System.IO.FileStream fs = new System.IO.FileStream(saveLocation, System.IO.FileMode.Create))
                {
                    var enc = System.Text.Encoding.ASCII;
                    string eq = "=";
                    string nl = "\r\n";
                    
                    //Write first line of the request
                    string requestTop = Request.HttpMethod + " " + Request.FilePath + " " + Request.Params["SERVER_PROTOCOL"];
                    fs.Write(enc.GetBytes(requestTop), 0, requestTop.Length);
                    fs.Write(enc.GetBytes(nl), 0, 2);
                    
                    //Write all the headers
                    for (int i = 0; i < Request.Headers.Count; i++)
                    {
                        fs.Write(enc.GetBytes(Request.Headers.AllKeys[i]), 0, Request.Headers.AllKeys[i].Length);
                        fs.Write(enc.GetBytes(eq), 0, 1);
                        fs.Write(enc.GetBytes(Request.Headers[i]), 0, Request.Headers[i].Length);
                        fs.Write(enc.GetBytes(nl), 0, 2);
                    }

                    //Write the data stream
                    Request.InputStream.CopyTo(fs);                    
                }
            }
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

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Upload</title>
</head>
<body>
    To use this page, send a multipart upload from Scenario 3 of the modified Background Transfer Sample for Chapter 14
</body>
</html>
