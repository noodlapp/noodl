import React from 'react';

export function NoHomeError() {
  return (
    <div
      style={{
        overflowY: 'auto',
        padding: '24px',
        fontFamily: 'Open Sans',
        fontSize: '16px',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#F57569'
      }}
    >
      <div style={{ marginBottom: '50px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <span>ERROR</span>
        <img src="ndl_assets/noodl-logo-black.svg" style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ margin: '0 auto', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: '50px' }}>
          No <img src="ndl_assets/home-icon.svg" style={{ marginRight: '-6px' }} />{' '}
          <span style={{ fontWeight: 'bold' }}>HOME</span> component selected
        </div>

        <div style={{ textAlign: 'center' }}>
          Click <span style={{ fontWeight: 'bold' }}>Make home</span> as shown below.
        </div>

        <img style={{ marginTop: '24px' }} srcSet="ndl_assets/make-home-instructions@2x.png 2x" />
      </div>
    </div>
  );
}
