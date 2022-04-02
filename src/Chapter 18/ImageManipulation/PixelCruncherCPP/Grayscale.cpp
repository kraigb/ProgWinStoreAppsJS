#include "pch.h"
#include "Grayscale.h"
#include <ppltasks.h>

using namespace PixelCruncherCPP;
using namespace Platform;
using namespace Windows::Foundation;
using namespace concurrency;


/*
 * Grayscale class
 */

Grayscale::Grayscale()
{
}

bool Grayscale::Convert(const Array<uint8>^ imageDataIn, WriteOnlyArray<uint8>^ imageDataOut)
{
    //Check for any conditions here for which you might want to throw an exception
    if (imageDataOut->Length != imageDataIn->Length)
    {                              
        throw ref new InvalidArgumentException;
    }

    int i;
    int length = static_cast<int>(imageDataIn->Length);
    const int colorOffsetRed = 0;
    const int colorOffsetGreen = 1;
    const int colorOffsetBlue = 2;
    const int colorOffsetAlpha = 3;

    uint8 r, g, b, gray;
                
    for (i = 0; i < length; i += 4)
    {
        r = imageDataIn[i + colorOffsetRed];
        g = imageDataIn[i + colorOffsetGreen];
        b = imageDataIn[i + colorOffsetBlue];

        //Assign each rgb value to brightness for grayscale
        gray = (uint8)(.3 * r + .55 * g + .11 * b);

        imageDataOut[i + colorOffsetRed] = gray;
        imageDataOut[i + colorOffsetGreen] = gray;
        imageDataOut[i + colorOffsetBlue] = gray;
        imageDataOut[i + colorOffsetAlpha] = imageDataIn[i + colorOffsetAlpha];
    }
            
    return true;
}





