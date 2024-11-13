// Function to toggle the password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    // Toggle the password type between 'password' and 'text'
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.name = "eye-outline"; // Change icon to 'eye' when visible
    } else {
        passwordInput.type = "password";
        eyeIcon.name = "eye-off-outline"; // Change icon to 'eye-off' when hidden
    }
}

function togglePasswordVisibility2(){
    const passwordInput = document.getElementById('newPassword');
    const eyeIcon = document.getElementById('eye-icon');

    // Toggle the password type between 'password' and 'text'
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.name = "eye-outline"; // Change icon to 'eye' when visible
    } else {
        passwordInput.type = "password";
        eyeIcon.name = "eye-off-outline"; // Change icon to 'eye-off' when hidden
    }
}