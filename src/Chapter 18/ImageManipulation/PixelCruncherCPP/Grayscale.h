#pragma once

namespace PixelCruncherCPP
{
    public ref class Tests sealed
    {
    public:
        Tests();

        static Platform::String^ TestMethod(bool throwAnException);
		property int TestProperty;
        static double CountFromZero(double max, double increment);
        static Windows::Foundation::IAsyncOperation<double>^ CountFromZeroAsync(double max, double increment);
    };

    //To hide this from apps written in JavaScript, uncomment the attribute below
    //[Windows::Foundation::Metadata::WebHostHidden]
    public ref class Grayscale sealed
    {
    public:
        Grayscale();
        
        bool Convert(const Platform::Array<uint8>^ imageDataIn, Platform::WriteOnlyArray<uint8>^ imageDataOut);        
    };
}