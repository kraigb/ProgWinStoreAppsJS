using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using Windows.System.Threading;
using Windows.Storage;
using Windows.Storage.Streams;
using Windows.Graphics.Imaging;

namespace Utilities
{
    public sealed class ImageConverter
    {
        // This TranscodeImage function is equivalent to what we wrote in JavaScript for Chapter 13.
        // It is written here in C# as a WinRT component to show how the code looks in that language.
        // Primary benefits in C# are the "using" statement to manage streams (which makes sure they're
        // closed properly), and the simplicity of the await keyword that allows us to write this
        // routine in a much cleaner way than with WinJS promises. This demonstrates that for a 
        // complex routine with many async operations, a WinRT component in C# can be a good choice.

        public static IAsyncOperation<String> TranscodeImageAsync(StorageFile source, String filename,
            uint width, uint height)
        {
            return AsyncInfo.Run<String>((token) => Task.Run<String>(async () =>
            {
                String result = null;

                if (source == null) { return null; }
                if (filename == null) { return null; }

                try
                {
                    using (IRandomAccessStream readStream = await source.OpenAsync(FileAccessMode.Read))
                    {
                        BitmapDecoder decoder = await BitmapDecoder.CreateAsync(readStream);

                        // Re-encode the image at width and height into target file
                        StorageFile file = await ApplicationData.Current.LocalFolder.CreateFileAsync(
                            filename, CreationCollisionOption.ReplaceExisting);

                        using (IRandomAccessStream writeStream = await file.OpenAsync(FileAccessMode.ReadWrite))
                        {
                            writeStream.Size = 0;  //Be sure to clean out existing file

                            //Set up the decoder properties to get the pixel data
                            BitmapTransform transform = new BitmapTransform();
                            transform.ScaledWidth = width;
                            transform.ScaledHeight = height;

                            PixelDataProvider pp = await decoder.GetPixelDataAsync(decoder.BitmapPixelFormat,
                                decoder.BitmapAlphaMode, transform, ExifOrientationMode.RespectExifOrientation,
                                ColorManagementMode.ColorManageToSRgb);
                            Byte[] pixels = pp.DetachPixelData();

                            //Now we're ready to encode to the new file
                            BitmapEncoder encoder = await BitmapEncoder.CreateAsync(BitmapEncoder.JpegEncoderId, writeStream);
                            encoder.SetPixelData(decoder.BitmapPixelFormat, decoder.BitmapAlphaMode,
                                width, height, decoder.DpiX, decoder.DpiY, pixels);
                            await encoder.FlushAsync();
                            result = "ms-appdata:///local/" + file.Name;
                        }
                    }
                }
                catch (Exception e)
                {
                    //Nothing to do, returnString already set
                }

                return result;
            }));
        }
    }
}
