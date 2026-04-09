$(document).ready(function () {
    // Inject CSS fix for 32-inch TV display
    var tvCss = `
        .two-panel-layout { min-width: 0; }
        .panel-col { min-width: 0; }
        .panel-scroll { overflow-x: hidden; }
        .panel-scroll .data-table { table-layout: fixed; width: 100%; }
        .panel-scroll .data-table th,
        .panel-scroll .data-table td { white-space: normal !important; word-wrap: break-word; overflow-wrap: break-word; vertical-align: top; }
        .panel-scroll .data-table th:nth-child(1),
        .panel-scroll .data-table td:nth-child(1) { width: 45px; }
        .panel-scroll .data-table th:nth-child(2),
        .panel-scroll .data-table td:nth-child(2) { width: 130px; }
        .panel-scroll .data-table th:nth-child(3),
        .panel-scroll .data-table td:nth-child(3) { width: 90px; }
        .panel-scroll .data-table th:nth-child(4) { width: auto; }
        .panel-scroll .data-table th:nth-child(5),
        .panel-scroll .data-table td:nth-child(5) { width: 30%; }
    `;
    $('<style>').text(tvCss).appendTo('head');

    _waiting_room.GetList();
    _waiting_room.GetList_Da_SL();
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/CarHub", { transport: signalR.HttpTransportType.WebSockets, skipNegotiation: true })
        .withAutomaticReconnect([2000, 5000, 10000])
        .build();
    connection.start()
        .then(() => console.log("✅ SignalR connected"))
        .catch(err => console.error(err));

    function renderRow(item) {
        var date = new Date(item.vehicleArrivalDate);
        let formatted =
            String(date.getHours()).padStart(2, '0') + ":" +
            String(date.getMinutes()).padStart(2, '0') + " " +
            String(date.getDate()).padStart(2, '0') + "/" +
            String(date.getMonth() + 1).padStart(2, '0') + "/" +
            date.getFullYear();

        var html_tt = ``;
        switch (item.trangThai) {
            case 1:
                html_tt = '<span class="badge badge-warning">Chưa có</span>'
                break;
            case 2:
                html_tt = `<span class="badge badge-success">Còn hạn</span>`
                break;
            case 3:
                html_tt = `<span class="badge badge-warning">Sắp hết hạn</span>`
                break;
            case 4:
                html_tt = '<span class="badge badge-danger">Hết hạn</span>'
                break;

        }

        return `
        <tr class="waiting_room_${item.id}" data-queue="${formatted}"  >
            <td>${item.recordNumber}</td>
            <td>${formatted}</td>
            <td>${item.vehicleNumber} </td>
            <td>
            <div style="display: flex; align-items: center">
                 <div style="white-space: pre-line;">
                      ${item.customerName} 
                 </div>
            </div>
            </td>
            <td> ${item.csNotes == null ? '' : item.csNotes} </td>
        </tr>`;
    }
    function sortTable() {
        const tbody = document.getElementById("dataBody-0");
        const rows = Array.from(tbody.querySelectorAll("tr"));

        rows.sort((a, b) => {
            const timeA = parseDateTime(a.dataset.queue);
            const timeB = parseDateTime(b.dataset.queue);
            return timeA - timeB; // tăng dần
        });

        tbody.innerHTML = "";
        rows.forEach(r => tbody.appendChild(r));
    }
    connection.off("ListProcessingIsLoading_Da_SL");
    connection.on("ListProcessingIsLoading_Da_SL", function (item) {
        $('.waiting_room_' + item.id).remove();

    });
    connection.off("ListProcessingIsLoading");
    connection.on("ListProcessingIsLoading", function (item) {
        const tbody = document.getElementById("dataBody-0");
        $('.waiting_room_' + item.id).remove();
        tbody.insertAdjacentHTML("beforeend", renderRow(item));
        sortTable(); // sắp xếp lại ngay khi thêm
    });

    connection.off("ListCartoFactory");
    connection.on("ListCartoFactory", function (item) {
        $('#dataBody-0').find('.waiting_room_' + item.id).remove();
        const tbody = document.getElementById("dataBody-0");
        $('.waiting_room_' + item.id).remove();
        tbody.insertAdjacentHTML("beforeend", renderRow(item));
        sortTable();
    });

    connection.off("ProcessingIsLoading_khoa");
    connection.on("ProcessingIsLoading_khoa", function (item) {
        const tbody = document.getElementById("dataBody-0");
        $('.waiting_room_' + item.id).remove();
        tbody.insertAdjacentHTML("beforeend", renderRow(item));
        sortTable(); // sắp xếp lại ngay khi thêm
    });
    //lấy từ ds xe đến nhà máy
    connection.off("ListCartoFactory_Da_SL");
    connection.on("ListCartoFactory_Da_SL", function (item) {
        const tbody = document.getElementById("dataBody-0");
        tbody.insertAdjacentHTML("beforeend", renderRow(item));
        sortTable_Da_SL(); // sắp xếp lại ngay khi thêm
    });
    connection.off("ListCartoFactory");
    connection.on("ListCartoFactory", function (item) {
        $('#dataBody-0').find('.waiting_room_' + item.id).remove();
    });
    connection.onreconnecting(error => {
        console.warn("🔄 Đang reconnect...", error);
    });

    connection.onreconnected(connectionId => {
        console.log("✅ Đã reconnect. Connection ID:", connectionId);
    });

    connection.off("ListProcessingIsLoading_Da_SL");
    connection.on("ListProcessingIsLoading_Da_SL", function (item) {
        const tbody = document.getElementById("dataBody-1");
        $('.waiting_room_' + item.id).remove();
        tbody.insertAdjacentHTML("beforeend", renderRow(item));
        sortTable_Da_SL(); // sắp xếp lại ngay khi thêm
    });
    connection.off("ListCallTheScale_0");
    connection.on("ListCallTheScale_0", function (item) {
        const tbody = document.getElementById("dataBody-1");
        tbody.insertAdjacentHTML("beforeend", renderRow_DA_SL(item));
        sortTable_Da_SL(); // sắp xếp lại ngay khi thêm
    });
    connection.off("ListCallTheScale_1");
    connection.on("ListCallTheScale_1", function (item) {
        const tbody = document.getElementById("dataBody-1");
        tbody.insertAdjacentHTML("beforeend", renderRow_DA_SL(item));
        sortTable_Da_SL(); // sắp xếp lại ngay khi thêm
    });
    // Nhận data mới từ server
    connection.off("ListCallTheScale_Da_SL");
    connection.on("ListCallTheScale_Da_SL", function (item) {
        const tbody = document.getElementById("dataBody-1");
        $('.waiting_room_' + item.id).remove();
        tbody.insertAdjacentHTML("beforeend", renderRow_Da_SL(item));
        sortTable_Da_SL(); // sắp xếp lại ngay khi thêm
    });
    connection.onclose(error => {
        console.error("❌ Kết nối bị đóng.", error);
    });
    function parseDateTime(str) {
        // "11:33 17/12/2025"
        const [time, date] = str.split(" ");
        const [hour, minute] = time.split(":").map(Number);
        const [day, month, year] = date.split("/").map(Number);

        return new Date(year, month - 1, day, hour, minute).getTime();
    };
});

var _waiting_room = {
    init: function () {
        _waiting_room.GetList();
        _waiting_room.GetList_Da_SL();

    },
    GetList: function () {
        var model = {
            VehicleNumber: "",
            PhoneNumber: "",
            VehicleStatus: 0,
            LoadType: null,
            VehicleWeighingType: null,
            VehicleTroughStatus: null,
            TroughType: null,
            VehicleWeighingStatus: null,
            LoadingStatus: null,
            type: 0,
        }
        $.ajax({
            url: "/WaitingRoom/GetList",
            type: "post",
            data: { SearchModel: model },
            success: function (result) {
                $('#imgLoading').hide();
                $('#Processing_Is_Loading').html(result);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("Status: " + textStatus);
            }
        });
    },
    GetList_Da_SL: function () {
        var model = {
            VehicleNumber: "",
            PhoneNumber: "",
            VehicleStatus: 0,
            LoadType: null,
            VehicleWeighingType: null,
            VehicleTroughStatus: null,
            TroughType: null,
            VehicleWeighingStatus: null,
            LoadingStatus: 0,
            type: 1,
        }
        $.ajax({
            url: "/WaitingRoom/GetList",
            type: "post",
            data: { SearchModel: model },
            success: function (result) {
                $('#imgLoading').hide();
                $('#Processing_Is_Loading_Da_SL').html(result);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("Status: " + textStatus);
            }
        });
    },
}