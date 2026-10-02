"use client";

import ReactSelect, { type Props as ReactSelectProps } from "react-select";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";

/**
 * react-select, rendered only after mount.
 *
 * react-select paints a visually-hidden live region whose text is built for the
 * current environment. Prerendered on the server it does not match what the client
 * produces, and React discards the whole server-rendered tree and re-renders it:
 *
 *   Hydration failed because the server rendered text didn't match the client.
 *     <Select ...><SelectContainer ...><LiveRegion ...>
 *
 * The mismatch lands on the select's live region, not on anything the admin typed,
 * so it is invisible - but it throws away the prerendered HTML for the page and
 * costs a full client render.
 *
 * Deferring to after mount is react-select's own documented workaround. The
 * placeholder reserves the control's height so nothing shifts once it appears.
 */
export default function ClientOnlyReactSelect(props: ReactSelectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        aria-hidden
        sx={{
          height: props.styles?.control
            ? undefined
            : 40, // matches the height the select's own control style uses
          flex: 1,
        }}
      />
    );
  }

  return <ReactSelect {...props} />;
}