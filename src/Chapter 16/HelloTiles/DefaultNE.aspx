<?xml version="1.0" encoding="utf-8" ?>
<%@ Page Language="C#" %>
<script runat="server">
    public string GenerateTileXML()
    {
        // Construct the large template
        NotificationsExtensions.TileContent.ITileSquare310x310SmallImagesAndTextList03 largeTile =
            NotificationsExtensions.TileContent.TileContentFactory.CreateTileSquare310x310SmallImagesAndTextList03();
        largeTile.Branding = NotificationsExtensions.TileContent.TileBranding.None;
        largeTile.ContentId = "1";
        largeTile.Lang = "en-US";
        
        largeTile.Image1.Src = "http://www.kraigbrockschmidt.com/images/Liam07.png";
        largeTile.TextHeading1.Text = "Liam--";
        largeTile.TextWrap1.Text = "Giddy on the day he learned to sit up!";
        
        largeTile.Image2.Src = "http://www.kraigbrockschmidt.com/images/Liam08.png";
        largeTile.TextHeading2.Text = "This is Liam";
        largeTile.TextWrap2.Text = "Exploring the great outdoors!";
        
        largeTile.Image3.Src = "http://www.kraigbrockschmidt.com/images/Liam13a.jpg";
        largeTile.TextHeading3.Text = "Still Liam";
        largeTile.TextWrap3.Text = "He's older now, almost 7";
                        
        // Construct the wide template
        NotificationsExtensions.TileContent.ITileWide310x150SmallImageAndText04 wideTile =
            NotificationsExtensions.TileContent.TileContentFactory.CreateTileWide310x150SmallImageAndText04();
        wideTile.Branding = NotificationsExtensions.TileContent.TileBranding.None;
        wideTile.Image.Src = "http://www.kraigbrockschmidt.com/images/Liam08.png";
        wideTile.TextHeading.Text = "This is Liam";
        wideTile.TextBodyWrap.Text = "Exploring the great outdoors!";

        // Construct the medium template
        NotificationsExtensions.TileContent.ITileSquare150x150PeekImageAndText02 squareTile =
            NotificationsExtensions.TileContent.TileContentFactory.CreateTileSquare150x150PeekImageAndText02();
        squareTile.Branding = NotificationsExtensions.TileContent.TileBranding.None;
        squareTile.Image.Src = "http://www.kraigbrockschmidt.com/images/Liam07.png";
        squareTile.TextHeading.Text = "Liam--";
        squareTile.TextBodyWrap.Text = "Giddy on the day he learned to sit up!";
                                
        // Attach the square template to the wide template notification
        wideTile.Square150x150Content = squareTile;
        
        // Attach the wide template to the large template
        largeTile.Wide310x150Content = wideTile;
        
        // The largeTile object is an XMLDOM object, suitable for issuing tile updates
        // directly. In this case we just want the XML text.
        return largeTile.ToString();
    }
</script>
<% = GenerateTileXML() %>
