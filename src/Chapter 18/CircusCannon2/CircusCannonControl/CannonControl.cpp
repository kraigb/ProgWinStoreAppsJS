#include "pch.h"
#include "CannonControl.h"
#include <ppltasks.h>

using namespace Platform;
using namespace Windows::Foundation;
using namespace Windows::Devices::Enumeration;
using namespace Windows::Devices::HumanInterfaceDevice;
using namespace Windows::Storage;
using namespace Windows::Storage::Streams;
using namespace Windows::UI::Core;
using namespace Windows::ApplicationModel::Core;
using namespace concurrency;
using namespace CircusCannonControl;

/*
* Controller class
*/

Controller::Controller()
{
    m_isConnected = false;
    m_status = nullptr;
    m_lastDevice = nullptr;
    m_device = nullptr;
    m_eventsRegistered = false;
    m_numberToFire = 0;
}


task<bool> Controller::_connectAsync()
{
    if (nullptr == m_lastDevice) {
        throw "No device was enumerated so last device id is undefined.";
    }

    IAsyncOperation<HidDevice^>^ deviceOp = HidDevice::FromIdAsync(m_lastDevice->Id, FileAccessMode::ReadWrite);

    auto task = create_task(deviceOp);

    return task.then([this](HidDevice^ device) {
        if (nullptr == device) {
            m_isConnected = false;
            m_status = _statusString(m_lastDevice->Id);
        }
        else {
            m_status = "OK";
            m_isConnected = true;
            m_device = device;
            _sendCommand(Commands::Stop);
            _registerEvents();
        }

        return m_isConnected;
    });
}


String^ Controller::_statusString(String^ id)
{
    DeviceAccessStatus status = DeviceAccessInformation::CreateFromId(id)->CurrentStatus;

    switch (status) {
    case DeviceAccessStatus::DeniedByUser:
        return ref new String(L"user did not give consent to access the device.");

    case DeviceAccessStatus::DeniedBySystem:
        return ref new String(L"access to this device denied by policy or lack of manifest declaration.");

    default:
        return ref new String(L"other error; device might be open in another app.");
    }
}


//TODO: make this method async
void Controller::_sendCommand(uint8 command)
{
    if (nullptr == m_device) {
        return;
    }

    HidOutputReport^ report = m_device->CreateOutputReport(ReportIDs::outputCommand);
    DataWriter^ dataWriter = ref new DataWriter();


    dataWriter->WriteByte(ReportIDs::outputCommand);
    dataWriter->WriteByte(command);

    for (int i = 0; i < 7; i++) {
        dataWriter->WriteByte(0);
    }

    report->Data = dataWriter->DetachBuffer();

    //TODO: better error handling here
    m_device->SendOutputReportAsync(report);
}



//TODO: this has to be async and deliver a status
IAsyncOperation<bool>^ Controller::ConnectAsync()
{
    return create_async([=]()
    {
        Platform::String ^ ccSelector = HidDevice::GetDeviceSelector(DeviceProperties::usage_page, DeviceProperties::usage_id,
            DeviceProperties::vid, DeviceProperties::pid);
        IAsyncOperation<DeviceInformationCollection^>^ deviceOp = DeviceInformation::FindAllAsync(ccSelector);

        return create_task(deviceOp).then([this](DeviceInformationCollection^ devices) {
            if (devices->Size == 0) {
                //This error message doesn't get through...not sure what the solution is.
                throw "No Circus Cannon devices found";
            }

            //Take the first one
            m_lastDevice = devices->GetAt(0);

            //Do the connect and return its result
            return _connectAsync();
        });
    });
}



void Controller::Disconnect()
{
    //Stop all existing movement
    _sendCommand(Commands::Stop);

    if (nullptr != m_device) {
        _unregisterEvents();
        delete m_device;
        m_device = nullptr;
        m_isConnected = false;
    }
}

void Controller::Left()
{
    //If we're at the left limit and haven't move away enough yet, ignore left commands.
    if (m_debounceLeftLimit) {
        return;
    }

    Left(Speed::Fast);
}

void Controller::Left(Speed speed)
{
    if (m_debounceLeftLimit) {
        return;
    }

    _sendCommand(speed == Speed::Fast ? Commands::Left : Commands::LeftSlow);
}

void Controller::Right()
{
    if (m_debounceRightLimit) {
        return;
    }

    Right(Speed::Fast);
}

void Controller::Right(Speed speed)
{
    if (m_debounceRightLimit) {
        return;
    }

    _sendCommand(speed == Speed::Fast ? Commands::Right : Commands::RightSlow);
}

void Controller::Up()
{
    if (m_debounceTopLimit) {
        return;
    }

    Up(Speed::Fast);
}

void Controller::Up(Speed speed)
{
    if (m_debounceTopLimit) {
        return;
    }

    _sendCommand(speed == Speed::Fast ? Commands::Up : Commands::UpSlow);
}

void Controller::Down()
{
    if (m_debounceBottomLimit) {
        return;
    }

    Down(Speed::Fast);
}

void Controller::Down(Speed speed)
{
    if (m_debounceBottomLimit) {
        return;
    }

    _sendCommand(speed == Speed::Fast ? Commands::Down : Commands::DownSlow);
}


void Controller::StepDelayThenStop(int delayMS)
{
    Windows::Foundation::TimeSpan time;
    time.Duration = delayMS * 10000;

    Windows::System::Threading::ThreadPoolTimer::CreateTimer(ref new Windows::System::Threading::TimerElapsedHandler(
        [this](Windows::System::Threading::ThreadPoolTimer^ timer) -> void
    {
        _sendCommand(Commands::Stop);
    }), time);
}

void Controller::LeftStep()
{
    if (m_debounceLeftLimit) {
        return;
    }

    _sendCommand(Commands::Left);
    StepDelayThenStop(500);
}

void Controller::RightStep()
{
    if (m_debounceRightLimit) {
        return;
    }

    _sendCommand(Commands::Right);
    StepDelayThenStop(500);
}

void Controller::UpStep()
{
    if (m_debounceTopLimit) {
        return;
    }

    _sendCommand(Commands::Up);
    StepDelayThenStop(500);
}

void Controller::DownStep()
{
    if (m_debounceBottomLimit) {
        return;
    }

    _sendCommand(Commands::Down);
    StepDelayThenStop(500);
}


void Controller::UpLeft()
{
    if (m_debounceTopLimit || m_debounceLeftLimit) {
        return;
    }

    _sendCommand(Commands::UpLeft);
}

void Controller::UpRight()
{
    if (m_debounceTopLimit || m_debounceRightLimit) {
        return;
    }

    _sendCommand(Commands::UpRight);
}

void Controller::DownLeft()
{
    if (m_debounceBottomLimit || m_debounceLeftLimit) {
        return;
    }
    _sendCommand(Commands::DownLeft);
}

void Controller::DownRight()
{
    if (m_debounceBottomLimit || m_debounceRightLimit) {
        return;
    }

    _sendCommand(Commands::DownRight);
}

void Controller::Stop()
{
    _sendCommand(Commands::Stop);
}

void Controller::FireOne()
{
    m_numberToFire = 1;
    _sendCommand(Commands::Fire);
}

void Controller::FireAll()
{
    m_numberToFire = 3;
    _sendCommand(Commands::Fire);
}

void Controller::_registerEvents()
{
    if (!m_eventsRegistered) {
        // Save event registration token so we can unregisted for events
        m_inputReportEventToken = m_device->InputReportReceived +=
            ref new TypedEventHandler<HidDevice^, HidInputReportReceivedEventArgs^>(this, &Controller::_onInputReportEvent);

        m_eventsRegistered = true;
    }
}

void Controller::_unregisterEvents()
{
    if (m_eventsRegistered) {
        m_device->InputReportReceived -= m_inputReportEventToken;
    }

    m_eventsRegistered = false;
}

void Controller::_onInputReportEvent(HidDevice^ sender, HidInputReportReceivedEventArgs^ e)
{
    DataReader^ dataReader = DataReader::FromBuffer(e->Report->Data);
    uint8 reportId = dataReader->ReadByte();

    if (reportId != ReportIDs::inputStatus) {
        return;
    }

    uint8 upDown = dataReader->ReadByte();
    uint8 leftRightMissile = dataReader->ReadByte();

    //Check for hitting limits. When this happens we want to prevent any further momement
    //in that direction, so we first stop the movement. Now limit status bits are set when an
    //internal switch is depressed, and that switch will stay depressed until some movement in the
    //opposite direction releases it. This is somewhat imprecise so far as the mechanics are
    //concerned, so we want to remember that the switch is depressed and then ignore it until it's
    //been released again, thereby allowing opposite movement. Elsewhere, notive that we ignore
    //commands to move in the same direction as one that's currently being debounced.

    //All the limit switches will follow this pattern: I'll just comment the first one here.
    if (leftRightMissile & Controller::status::leftLimit) {
        //If this limit was just hit, fire event, stop movement, and remember to debounce.
        if (!m_debounceLeftLimit) {
            FireEventOnUIThread(LeftLimitChanged(this, true));
            _sendCommand(Commands::Stop);
            m_debounceLeftLimit = true;    //Ignore any subsequent input reports with this still on
        }
    }
    else {
        //As soon as we get an input report where the limit has been turned off, reset the flag
        //and fire and event to that effect.
        if (m_debounceLeftLimit) {
            m_debounceLeftLimit = false;
            FireEventOnUIThread(LeftLimitChanged(this, false));
        }
    }


    if (leftRightMissile & Controller::status::rightLimit) {
        if (!m_debounceRightLimit) {
            FireEventOnUIThread(RightLimitChanged(this, true));
            _sendCommand(Commands::Stop);
            m_debounceRightLimit = true;
        }
    }
    else {
        if (m_debounceRightLimit) {
            m_debounceRightLimit = false;
            FireEventOnUIThread(RightLimitChanged(this, false));
        }
    }

    if (upDown & Controller::status::topLimit) {
        if (!m_debounceTopLimit) {
            FireEventOnUIThread(TopLimitChanged(this, true));
            _sendCommand(Commands::Stop);
            m_debounceTopLimit = true;
        }
    }
    else {
        if (m_debounceTopLimit) {
            m_debounceTopLimit = false;
            FireEventOnUIThread(TopLimitChanged(this, false));
        }
    }

    if (upDown & Controller::status::bottomLimit) {
        if (!m_debounceBottomLimit) {
            FireEventOnUIThread(BottomLimitChanged(this, true));
            _sendCommand(Commands::Stop);
            m_debounceBottomLimit = true;
        }
    }
    else {
        if (m_debounceBottomLimit) {
            m_debounceBottomLimit = false;
            FireEventOnUIThread(BottomLimitChanged(this, false));
        }
    }


    //The fire switch gets tripped some time before the missile is actually shot out.
    //We want then to wait until the switch is released to raise the event and to count
    //down the number we're supposed to fire. This makes our debounce model different from
    //the limit switches.

    if (leftRightMissile & Controller::status::missileFired) {
        //If switch just went down, set the debounce flag		
        m_debounceMissileFired = true;

    }
    else {
        //Switch just came up. If we were waiting to debounce, check if we still have missiles to launch.		
        if (m_debounceMissileFired) {
            if (m_numberToFire > 0) {
                //We're still waiting to fire at least one, so raise event
                FireEventOnUIThread(MissileFired(this, true));

                //Count down, and if we're done, stop after a show delay to make sure the switch is moved a little.
                //We do this because it's just the nature of the hardware that we want to make sure the switch is 
                //fully released; otherwise the next fire command might come with the switch still down and we'd
                //stop before the missile is actually fired.

                //This shows the utility of having a WinRT component for a device like this, because we can hide the
                //quirks of the device in the component and present a clean interaction interface to our clients.
                if (--m_numberToFire == 0) {
                    StepDelayThenStop(100);
                }
            }

            //Reset debounce flag
            m_debounceMissileFired = false;
        }
    }

}