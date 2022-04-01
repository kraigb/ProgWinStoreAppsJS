#include "pch.h"
#include "Grayscale.h"
#include <ppltasks.h>

using namespace PixelCruncherCPP;
using namespace Platform;
using namespace Windows::Foundation;
using namespace concurrency;

Tests::Tests()
{
}

//A test method to count for a potentially long time.
double Tests::CountFromZero(double max, double increment)
{
    double sum = 0;

    for (double x = 0; x < max; x += increment)
    {
        sum += x;
    }

    return sum;
}


//Async version of CountFromZero (non-cancellable)
IAsyncOperation<double>^ Tests::CountFromZeroAsync(double max, double increment)
{
    return create_async([max, increment]() 
    {
        double sum = 0;

        for (double x = 0; x < max; x += increment)
        {
            sum += x;
        }

        return sum;
    });
}


String^ Tests::TestMethod(bool throwAnException)
{
    if (throwAnException)
    {
        throw ref new InvalidArgumentException;
    }

    return ref new String(L"Tests.TestMethod succeeded");
}