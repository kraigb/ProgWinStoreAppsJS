#pragma once
#include <ppltasks.h>

namespace CircusCannonControl
{
    public enum class Speed : int
    {
        Slow = 0,
        Fast = 1
    };

    //Control commands
    private enum Commands : uint8
    {
        Stop = 0x00,
        Up = 0x01,
        UpSlow = 0x0D,
        Down = 0x02,
        DownSlow = 0x0E,
        Left = 0x04,
        LeftSlow = 0x07,
        Right = 0x08,
        RightSlow = 0x0B,
        Fire = 0x10,
        UpLeft = 0x01 + 0x04,
        UpRight = 0x01 + 0x08,
        DownLeft = 0x02 + 0x04,
        DownRight = 0x02 + 0x08,
        Nop = 0xFF
    };

    //NOTE: originally I tried including these IDs and properties as const members of the
    //class, but when I added the events I got strange C2888 compiler errors about namespaces
    //that were very confusing. Moving these to enums in the namespace solved the problem, though
    //I can't say why, exactly.
    private enum ReportIDs : uint8
    {
        outputCommand = 0x00,
        inputStatus = 0x00
    };

    private enum DeviceProperties : uint16
    {
        vid = 0x1941,
        pid = 0x8021,
        usage_page = 0xFFA0,
        usage_id = 0x0001
    };


    public ref class Controller sealed
    {
    private:
        bool m_isConnected;
        Platform::String^ m_status;

        Windows::Devices::Enumeration::DeviceInformation^ m_lastDevice;
        Windows::Devices::HumanInterfaceDevice::HidDevice^ m_device;

        Concurrency::task<bool> _connectAsync();
        void _sendCommand(uint8 command);
        Platform::String^ _statusString(Platform::String^ id);

        void StepDelayThenStop(int delay);

        bool m_eventsRegistered;
        void _registerEvents(void);
        void _unregisterEvents(void);
        Windows::Foundation::EventRegistrationToken m_inputReportEventToken;

        void _onInputReportEvent(
            Windows::Devices::HumanInterfaceDevice::HidDevice^ sender,
            Windows::Devices::HumanInterfaceDevice::HidInputReportReceivedEventArgs^ eventArgs);

        //Counter for processing missile fired signals
        int m_numberToFire;

        //Bit masks for limit indicators in input report
        static enum status : uint8
        {
            topLimit = 0x80,
            bottomLimit = 0x40,
            leftLimit = 0x04,
            rightLimit = 0x08,
            missileFired = 0x80
        };

        //Byte positions of status bits in the input report
        static enum offset : int
        {
            upDown = 1,
            leftRight = 2,
            missile = 2
        };

        //Internal flags indicating status debouncing (we're at a limit but will
        //ignore subsequent status reports for this limit switch until we move away
        //enough for the status to be reset. This also blocks commands to move in that
        //direction so we don't strip the device's gears.
        bool m_debounceLeftLimit;
        bool m_debounceRightLimit;
        bool m_debounceMissileFired;
        bool m_debounceTopLimit;
        bool m_debounceBottomLimit;

    public:
        Controller();

        property bool IsConnected
        {
            bool get()
            {
                return m_isConnected;
            };
        };

        property Platform::String^ Status
        {
            Platform::String^ get()
            {
                return m_status;
            };
        };

        event Windows::Foundation::EventHandler<bool>^ LeftLimitChanged;
        event Windows::Foundation::EventHandler<bool>^ RightLimitChanged;
        event Windows::Foundation::EventHandler<bool>^ TopLimitChanged;
        event Windows::Foundation::EventHandler<bool>^ BottomLimitChanged;
        event Windows::Foundation::EventHandler<bool>^ MissileFired;

        Windows::Foundation::IAsyncOperation<bool>^ ConnectAsync();
        void Disconnect();

        void Left();
        void Left(Speed speed);
        void Right();
        void Right(Speed speed);
        void Up();
        void Up(Speed speed);
        void Down();
        void Down(Speed speed);

        void LeftStep();
        void RightStep();
        void UpStep();
        void DownStep();

        void UpLeft();
        void UpRight();
        void DownLeft();
        void DownRight();

        void Stop();
        void FireOne();
        void FireAll();
    };
}

//Convenient macro for raising events
#define FireEventOnUIThread(x) \
    CoreApplication::MainView->CoreWindow->Dispatcher->RunAsync(CoreDispatcherPriority::Normal, \
    ref new Windows::UI::Core::DispatchedHandler([this]() \
{ \
    x; \
}))

