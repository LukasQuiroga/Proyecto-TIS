package com.lacomarcasoft.dto.request;

import java.util.List;

public record ImportarUsuariosSolicitud(

        List<ImportarUsuarioFilaSolicitud> usuarios,

        String estadoPorDefecto

) {
}