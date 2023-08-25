export function getCurrentDateTime() {
    var currentDate = new Date();

    var hours = String(currentDate.getHours()).padStart(2, '0');
    var minutes = String(currentDate.getMinutes()).padStart(2, '0');
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    var year = currentDate.getFullYear();

    return hours + ':' + minutes + ' ' + day + '/' + month + '/' + year;
}
