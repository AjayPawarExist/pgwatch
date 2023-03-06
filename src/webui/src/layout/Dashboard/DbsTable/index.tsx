import { useState } from "react";

import { Alert, AlertColor, Box, Snackbar, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "queryClient";

import { ErrorComponent } from "layout/common/ErrorComponent";
import { databasesColumns } from "layout/common/Grid/GridColumns";
import { GridToolbarComponent } from "layout/common/Grid/GridToolbarComponent";
import { LoadingComponent } from "layout/common/LoadingComponent";

import { QueryKeys } from "queries/queryKeys";
import { Db } from "queries/types/DbTypes";
import DbService from "services/Db";

import { ModalComponent } from "./ModalComponent";

export const DbsTable = () => {
  const services = DbService.getInstance();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [severity, setSeverity] = useState<AlertColor>();
  const [editData, setEditData] = useState<Db>();

  const { status, data, error } = useQuery<Db[]>({
    queryKey: QueryKeys.db,
    queryFn: async () => {
      return await services.getMonitoredDb();
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (uniqueName: string) => {
      return await services.deleteMonitoredDb(uniqueName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.db });
      handleAlertOpen("Monitored DB has been deleted successfully!", "success");
    },
    onError: (error: any) => {
      handleAlertOpen(error.response.data, "error");
    }
  });

  const handleAlertOpen = (text: string, type: AlertColor) => {
    setSeverity(type);
    setAlertText(text);
    setAlertOpen(true);
  };

  const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    setAlertOpen(false);
  };

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const columns = databasesColumns(
    {
      setEditData,
      handleModalOpen,
      deleteRecord
    }
  );

  if (status === "loading") {
    return (
      <LoadingComponent />
    );
  };

  if (status === "error") {
    return (
      <ErrorComponent errorMessage={String(error)} />
    );
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} height="100%">
      <Snackbar open={alertOpen} autoHideDuration={5000} onClose={handleAlertClose}>
        <Alert sx={{ width: "auto" }} variant="filled" severity={severity}>{alertText}</Alert>
      </Snackbar>
      <Typography variant="h5">
        Databases under monitoring
      </Typography>
      <DataGrid
        columns={columns}
        rows={data}
        getRowId={(row) => row.md_unique_name}
        rowsPerPageOptions={[]}
        components={{ Toolbar: () => <GridToolbarComponent handleModalOpen={handleModalOpen} setEditData={setEditData} /> }}
        disableColumnMenu
      />
      <ModalComponent open={modalOpen} setOpen={setModalOpen} handleAlertOpen={handleAlertOpen} recordData={editData} />
    </Box>
  );
};
