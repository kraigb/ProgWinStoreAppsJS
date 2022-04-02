using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Collections;
using Windows.Foundation;
using System.Diagnostics;
using Windows.Foundation.Collections;
using Windows.Storage;
using Windows.Storage.Streams;
using Windows.Graphics.Imaging;


namespace PixelCruncherCS
{
    //Class to contain our component tests
    public sealed class Tests
    {        
        //A test method to count for a potentially long time.
        public static double CountFromZero(double max, double increment)
        {
            double sum = 0;

            for (double x = 0; x < max; x += increment)
            {
                sum += x;
            }

            return sum;
        }
        

        //Async version of CountFromZero (non-cancellable)
        public static IAsyncOperation<double> CountFromZeroAsync(double max, double increment)
        {
            var task = Task.Run<double>(() =>
            {
                double sum = 0;

                for (double x = 0; x < max; x += increment)
                {
                    sum += x;
                }

                return sum;
            });

            return task.AsAsyncOperation();
        }


        //Async test for returning a vector        
        public static IAsyncOperation<IList<Byte>> CreateByteListAsync(int size)
        {
            var task = Task.Run<IList<Byte>>(() =>
            {
                Byte[] list = new Byte[size];

                for (int i = 0; i < size; i++)
                {
                    list[i] = (Byte)(i % 256);
                }

                return list.ToList();
            });

            return task.AsAsyncOperation();
        }
        
        //Test methods and properties
        public static string TestMethod(Boolean throwAnException)
        {
            if (throwAnException)
            {
                throw new System.Exception("Tests.TestMethod was asked to throw an exception.");
            }

            return "Tests.TestMethod succeeded";
        }

        public int TestProperty { get; set; }
    }    

    //To hide this from apps written in JavaScript, uncomment the attribute below
    //[Windows.Foundation.Metadata.WebHostHidden]
    public sealed class Grayscale
    {
        //Synchronous method to convert canvas pixel data (a byte array) to grayscale
        public Boolean Convert([ReadOnlyArray()] Byte[] imageDataIn, [WriteOnlyArray()] Byte[] imageDataOut)
        {
            //Check for any conditions here for which you might want to throw an exception
            if (imageDataOut.Length != imageDataIn.Length)
            {                              
                throw new ArgumentException("The size of the output array does not match the size of the input array.", "imageDataOut");
            }

            DoGrayscale(imageDataIn, imageDataOut);
            return true;
        }

        private delegate void PeriodicCallback();

        private static void DoGrayscale(Byte[] dataIn, Byte[] dataOut, PeriodicCallback periodicCallback = null)
        {
            int i;            
            int length = dataIn.Length;
            int countForCallback = 0;
            const int colorOffsetRed = 0;
            const int colorOffsetGreen = 1;
            const int colorOffsetBlue = 2;
            const int colorOffsetAlpha = 3;

            Byte r, g, b, gray;
                
            for (i = 0; i < length; i += 4)
            {
                r = dataIn[i + colorOffsetRed];
                g = dataIn[i + colorOffsetGreen];
                b = dataIn[i + colorOffsetBlue];

                //Assign each rgb value to brightness for grayscale
                gray = (Byte)(.3 * r + .55 * g + .11 * b);

                dataOut[i + colorOffsetRed] = gray;
                dataOut[i + colorOffsetGreen] = gray;
                dataOut[i + colorOffsetBlue] = gray;
                dataOut[i + colorOffsetAlpha] = dataIn[i + colorOffsetAlpha];

                //Check for cancellation every 50K pixels
                if (++countForCallback > 50000)
                {
                    if (periodicCallback != null)
                    {
                        periodicCallback();
                    }
                    countForCallback = 0;
                }
            }

            return;
        }


        //A more complicated method where the async operation is separate from managing the data
        private Byte[] _InputData = null;
        private Boolean InputDataAvailable = false;

        //Internal property that manages output data once converted
        private Boolean OutputDataAvailable = false;
        private Byte[] _OutputData = null;


        //Property through which we provide input data.
        public Byte[] InputData
        {
            get
            {
                return _InputData;
            }

            set
            {
                this.InputDataAvailable = (value != null);
                this._InputData = value;
            }
        }

        //Async method to convert the InputData array into a List (vector)
        public IAsyncOperation<IList<Byte>> ConvertPixelArrayAsync([ReadOnlyArray()] Byte[] imageDataIn)
        {
            //Use AsyncInfo to create an IAsyncOperation that supports cancellation
            return AsyncInfo.Run<IList<Byte>>((token) => Task.Run<IList<Byte>>(() =>
            {
                Byte[] imageDataOut = new Byte[imageDataIn.Length];
                DoGrayscale(imageDataIn, imageDataOut, () =>
                {
                    token.ThrowIfCancellationRequested();
                });

                return imageDataOut.ToList();
            }));
        }

        //Async method to convert the InputData array into OutputData
        public IAsyncAction ConvertArraysAsync()
        {
            //Define our async task

            //Use AsyncInfo to create an IAsyncOperation that supports cancellation
            return AsyncInfo.Run((token) => Task.Run(() =>
            {
                //Ensure cleanup of old data
                this._OutputData = null;
                
                Byte[] imageDataOut = new Byte[this._InputData.Length];

                DoGrayscale(this._InputData, imageDataOut, () =>
                {
                    token.ThrowIfCancellationRequested();
                });

                this._OutputData = imageDataOut;
                this.OutputDataAvailable = true;
                return;
            }));
        }

        public Byte[] DetachOutputData()
        {
            if (!this.OutputDataAvailable)
            {
                return null;
            }

            //The flag ensures that a caller cannot get to the data twice.
            //It will be cleaned up if the call is made again because we overwrite the array.
            this.OutputDataAvailable = false;
            
            //Save a reference to the data so we can return it after releasing our internal ref.
            var retval = this._OutputData;
            this._OutputData = null;
            return retval;
        }



        //A method that makes the whole grayscale conversion process more efficient
        public static IAsyncOperation<StorageFile> ConvertGrayscaleFileAsync(StorageFile file)
        {
            return AsyncInfo.Run<StorageFile>((token) => Task.Run<StorageFile>(async () =>
            {            
                StorageFile fileOut = null;

                try
                {
                    //Open the file and read in the pixels
                    using (IRandomAccessStream stream = await file.OpenReadAsync())
                    {
                        BitmapDecoder decoder = await BitmapDecoder.CreateAsync(stream);
                        PixelDataProvider pp = await decoder.GetPixelDataAsync();
                        Byte[] pixels = pp.DetachPixelData();

                        //We know that our own method can convert in-place, so we don't need to make a copy
                        DoGrayscale(pixels, pixels);

                        //Save to a temp file.
                        ApplicationData appdata = ApplicationData.Current;

                        fileOut = await appdata.TemporaryFolder.CreateFileAsync("ImageManipulation_GrayscaleConversion.png",
                            CreationCollisionOption.ReplaceExisting);

                        using (IRandomAccessStream streamOut = await fileOut.OpenAsync(FileAccessMode.ReadWrite))
                        {
                            BitmapEncoder encoder = await BitmapEncoder.CreateAsync(BitmapEncoder.PngEncoderId, streamOut);

                            encoder.SetPixelData(decoder.BitmapPixelFormat, decoder.BitmapAlphaMode,
                                decoder.PixelWidth, decoder.PixelHeight, decoder.DpiX, decoder.DpiY, pixels);

                            await encoder.FlushAsync();                            
                        }
                    }
                }
                catch
                {
                    //Error along the way; clear fileOut
                    fileOut = null;
                }

                //Finally, return the StorageFile we created, which makes it convenient for the caller to
                //copy it elsewhere, use in a capacity like URL.createObjectURL, or refer to it with
                //"ms-appdata:///temp" + fileOut.Name
                return fileOut;
            }));
        }     
    }
}
