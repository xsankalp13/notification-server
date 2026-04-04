export interface NotificationEvent {
    event: "STUDENT_CREATED";
    studentName: string;
    parentEmail?: string;
    parentPhone?: string;
}