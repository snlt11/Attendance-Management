
import AttendanceManagementLogo from "../../../images/attendance_managment_logo.png"

export default function AppLogo() {
    return (
        <>
            <div className="">
                <img src={AttendanceManagementLogo} alt="Attendance Management Logo" className='w-10 h-10' />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Attendance Management</span>
            </div>
        </>
    );
}
