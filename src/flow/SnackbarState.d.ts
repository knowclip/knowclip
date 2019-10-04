
declare type SnackbarData = {
  type: "SimpleMessage",
  props: {
    message: string
  }
};

declare type SnackbarState = {
  queue: Array<SnackbarData>
};
