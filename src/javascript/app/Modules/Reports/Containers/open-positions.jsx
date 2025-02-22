import { PropTypes as MobxPropTypes }      from 'mobx-react';
import PropTypes                           from 'prop-types';
import React                               from 'react';
import { withRouter }                      from 'react-router-dom';
import { localize }                        from '_common/localize';
import { urlFor }                          from '_common/url';
import DataTable                           from 'App/Components/Elements/DataTable';
import Localize                            from 'App/Components/Elements/localize.jsx';
import { website_name }                    from 'App/Constants/app-config';
import { getContractPath }                 from 'App/Components/Routes/helpers';
import EmptyTradeHistoryMessage            from 'Modules/Reports/Components/empty-trade-history-message.jsx';
import { ReportsMeta }                     from 'Modules/Reports/Components/reports-meta.jsx';
import { getOpenPositionsColumnsTemplate } from 'Modules/Reports/Constants/data-table-constants';
import PlaceholderComponent                from 'Modules/Reports/Components/placeholder-component.jsx';
import { connect }                         from 'Stores/connect';

class OpenPositions extends React.Component {
    componentDidMount() {
        this.props.onMount();
    }

    componentWillUnmount() {
        this.props.onUnmount();
    }

    getRowAction = (row_obj) => (
        row_obj.is_unsupported ?
            {
                component: (
                    <Localize
                        str='This trade type is currently not supported on [_1]. Please go to [_2]Binary.com[_3] for details.'
                        replacers={{
                            '1'  : website_name,
                            '2_3': <a className='link link--orange' rel='noopener noreferrer' target='_blank' href={urlFor('user/portfoliows', undefined, undefined, true)} />,
                        }}
                    />
                ),
            }
            : getContractPath(row_obj.id)
    );

    render() {
        const {
            active_positions,
            component_icon,
            is_loading,
            error,
            is_empty,
            currency,
            totals,
        } = this.props;

        if (error) {
            return <p>{error}</p>;
        }

        return (
            <React.Fragment>
                <ReportsMeta
                    i18n_heading={localize('Open positions')}
                    i18n_message={localize('View all active trades on your account that can still incur a profit or a loss.')}
                />
                {(is_loading && active_positions.length === 0) || is_empty ?
                    <PlaceholderComponent
                        is_loading={is_loading || !active_positions}
                        is_empty={is_empty}
                        empty_message_component={EmptyTradeHistoryMessage}
                        component_icon={component_icon}
                        localized_message={localize('You have no open positions yet.')}
                    />
                    :
                    currency && active_positions.length > 0 &&
                    <DataTable
                        className='open-positions'
                        columns={getOpenPositionsColumnsTemplate(currency)}
                        footer={totals}
                        data_source={active_positions}
                        getRowAction={this.getRowAction}
                    >
                        <PlaceholderComponent
                            is_loading={is_loading}
                        />
                    </DataTable>
                }
            </React.Fragment>

        );
    }
}

OpenPositions.propTypes = {
    active_positions: MobxPropTypes.arrayOrObservableArray,
    component_icon  : PropTypes.func,
    currency        : PropTypes.string,
    error           : PropTypes.string,
    history         : PropTypes.object,
    is_empty        : PropTypes.bool,
    is_loading      : PropTypes.bool,
    is_mobile       : PropTypes.bool,
    is_tablet       : PropTypes.bool,
    onMount         : PropTypes.func,
    onUnmount       : PropTypes.func,
    totals          : PropTypes.object,
};

export default connect(
    ({ modules, client }) => ({
        currency        : client.currency,
        active_positions: modules.portfolio.active_positions,
        error           : modules.portfolio.error,
        is_empty        : modules.portfolio.is_active_empty,
        is_loading      : modules.portfolio.is_loading,
        onMount         : modules.portfolio.onMount,
        onUnmount       : modules.portfolio.onUnmount,
        totals          : modules.portfolio.active_positions_totals,
    })
)(withRouter(OpenPositions));
