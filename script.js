
const STORAGE_KEY = "studentHubRecords";

const form = document.getElementById("studentForm");
const idInput = document.getElementById("studentId");
const nameInput = document.getElementById("studentName");
const emailInput = document.getElementById("studentEmail");
const courseInput = document.getElementById("studentCourse");

const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const formMessage = document.getElementById("formMessage");

const totalStudents = document.getElementById("totalStudents");
const totalCourses = document.getElementById("totalCourses");
const validEmails = document.getElementById("validEmails");
const recordCount = document.getElementById("recordCount");

// Email validation using Regular Expressions
const EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Read records from localStorage
function loadStudents() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const students = data ? JSON.parse(data) : [];

        if (!Array.isArray(students)) {
            throw new Error("Invalid student data.");
        }

        return students;
    } catch (error) {
        console.error("Unable to read student records:", error);
        showMessage("Could not read saved records.", false);
        return [];
    }
}

// Save records to localStorage
function saveStudents(students) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch (error) {
        console.error("Unable to save student records:", error);
        showMessage("Unable to save data. Check browser storage.", false);
        return false;
    }
}

// Display a message to the user
function showMessage(message, success = false) {
    formMessage.textContent = message;
    formMessage.className = success
        ? "message success"
        : "message";
}

// Create a table cell safely
function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

// Display student records
function renderStudents() {
    const students = loadStudents();
    const query = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter(student =>
        [
            student.id,
            student.name,
            student.email,
            student.course
        ].some(value =>
            String(value).toLowerCase().includes(query)
        )
    );

    tableBody.replaceChildren();

    filteredStudents.forEach(student => {
        const row = document.createElement("tr");

        // Student name and ID
        const studentCell = document.createElement("td");
        const studentInfo = document.createElement("div");
        studentInfo.className = "student-cell";

        const avatar = document.createElement("div");
        avatar.className = "student-avatar";
        avatar.textContent = student.name.charAt(0).toUpperCase();

        const details = document.createElement("div");

        const name = document.createElement("div");
        name.className = "student-name";
        name.textContent = student.name;

        const id = document.createElement("div");
        id.className = "student-id";
        id.textContent = student.id;

        details.append(name, id);
        studentInfo.append(avatar, details);
        studentCell.append(studentInfo);

        // Email
        const emailCell = createCell(student.email);

        // Course
        const courseCell = document.createElement("td");
        const courseBadge = document.createElement("span");
        courseBadge.className = "course-badge";
        courseBadge.textContent = student.course;
        courseCell.append(courseBadge);

        // Delete action
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.setAttribute(
            "aria-label",
            `Delete student ${student.name}`
        );

        deleteButton.addEventListener("click", () => {
            deleteStudent(student.id);
        });

        actionCell.append(deleteButton);
        row.append(studentCell, emailCell, courseCell, actionCell);
        tableBody.append(row);
    });

    emptyState.hidden = filteredStudents.length > 0;

    if (filteredStudents.length === 0 && query) {
        emptyState.querySelector("h3").textContent =
            "No matching students";
        emptyState.querySelector("p").textContent =
            "Try searching with a different keyword.";
    } else if (filteredStudents.length === 0) {
        emptyState.querySelector("h3").textContent =
            "No student records yet";
        emptyState.querySelector("p").textContent =
            "Add your first student using the form above.";
    }

    totalStudents.textContent = students.length;

    totalCourses.textContent = new Set(
        students.map(student => student.course.toLowerCase())
    ).size;

    validEmails.textContent = students.filter(
        student => EMAIL_REGEX.test(student.email)
    ).length;

    recordCount.textContent =
        `Showing ${filteredStudents.length} of ${students.length} students`;
}

// Add a student record
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const id = idInput.value.trim();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const course = courseInput.value.trim();

    try {
        // Validate required fields
        if (!id || !name || !email || !course) {
            throw new Error("All fields are required.");
        }

        if (/[,\t\r\n]/.test(id + name + email + course)) {
            throw new Error(
                "Commas and line breaks are not allowed."
            );
        }

        // Validate student ID
        const students = loadStudents();

        if (students.some(student =>
            student.id.toLowerCase() === id.toLowerCase()
        )) {
            throw new Error("Student ID already exists.");
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            throw new Error("Please enter a valid email address.");
        }

        const student = {
            id,
            name,
            email,
            course
        };

        students.push(student);

        if (!saveStudents(students)) {
            return;
        }

        showMessage("Student added successfully!", true);
        form.reset();
        renderStudents();

    } catch (error) {
        showMessage(error.message);
    }
});

// Delete a student
function deleteStudent(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    const students = loadStudents().filter(
        student => student.id !== id
    );

    if (saveStudents(students)) {
        showMessage("Student deleted successfully.", true);
        renderStudents();
    }
}

// Search student records
searchInput.addEventListener("input", renderStudents);

// Scroll to registration form
document.getElementById("addStudentBtn").addEventListener(
    "click", () => {
        document.getElementById("student-form").scrollIntoView({
            behavior: "smooth"
        });
        idInput.focus({ preventScroll: true });
    }
);

// Clear the form message when resetting
form.addEventListener("reset", () => {
    showMessage("");
});

// Export records as a JSON file
document.getElementById("exportBtn").addEventListener(
    "click", () => {
        const students = loadStudents();

        if (students.length === 0) {
            showMessage("No records available to export.");
            return;
        }

        const json = JSON.stringify(students, null, 2);
        const blob = new Blob([json], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "student-records.json";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
        showMessage("Student data exported successfully!", true);
    }
);

// Load saved records when the page opens
renderStudents();
