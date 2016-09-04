app.service('MysqlDBDriver', function()
{
    var queryLog = function(q)
    {
        console.info(q);
    };
    
    var service = {
        client: null,        
        errorMessage: null,
        status: false,
        serverVersion: 0,
        protocolVersion: 0,
        pendingQueries: [],
        connect: function (obj, callBack)
        {
            this.client = new MySQL.Client();
            this.client.setSocketImpl(new MySQL.ChromeSocket2());
            this.client.login(obj.hostName, (parseInt(obj.port) || 3306), obj.dbUsername, obj.dbPassword, null,
                function (initialHandshakeRequest, result)
                {
                    service.useDatabase(obj.dbName, function()
                    {
                        service.serverVersion = initialHandshakeRequest.serverVersion;
                        service.protocolVersion = initialHandshakeRequest.protocolVersion;
                        service.status = true;
                        if(callBack) callBack('done');
                        if(!empty(service.pendingQueries))
                        {
                            $.each(service.pendingQueries, function(i, q)
                            {
                                service.query(q.query, function(result)
                                {
                                    if(q.callBack) 
                                    {
                                        echo(result);
                                        q.callBack(result);                                        
                                    }
                                }, q.noResult);
                            });

                            service.pendingQueries = [];
                        }
                    });

                }                                         
            );
        },
        useDatabase: function(DBname, callBack)
        {
            this.query("USE `" + DBname + "`;", function()
            {
                if(callBack) callBack();
            }, null, true);
        },
        query: function(query, callBack, noResult, force)
        {
            queryLog(query);
            if(!this.status && !force) 
            {
                echo('pending')
                this.pendingQueries.push({query: query, callBack:callBack, noResult:noResult});
                return false;
            }
            this.client.query(query, function(columnDefinitions, resultsetRows) 
                {
                    if(noResult)
                    {                                   
                        if(callBack) callBack(columnDefinitions, resultsetRows);
                    }
                    else
                    {
                        var result = [];
                        $.each(resultsetRows, function(i, rs)
                        {
                            var newRS = {};
                            $.each(rs.values, function(ii, col)
                            {                            
                                newRS[columnDefinitions[ii].name] = col
                            });
                            result.push(newRS);
                        });
                        if(callBack) callBack(result);
                    }
                }, 
                function(result) 
                {
                    if(callBack) callBack(result.affectedRows, result.lastInsertId);
                }, 
                function(result) 
                { 
                    console.error(result.errorMessage)
                }, 
                function(result) 
                { // Cannot send query.
                    console.error('Cannot send query ' + query);
                }
            );
        },
        list: function(id, name, tableName, callBack, name2)
        {
            var query = 'SELECT '+id+', ' + name + ' FROM ' + tableName;
            queryLog(query);
            this.query(query, function(columnDefinitions, resultsetRows) 
                {
                    var result = {};
                    $.each(resultsetRows, function(i, rs)
                    {
                        var newRS = {};
                        $.each(rs.values, function(ii, col)
                        {                            
                            newRS[columnDefinitions[ii].name] = col
                        });
                        result[newRS[id]] = newRS[name2 || name];
                    });
                    if(callBack) callBack(result);
                }, true)
        },
        first: function(query, callBack)
        {
            query + ' limit 0, 1';
            this.query(query, function(result)
            {
                if(result && result[0])
                {
                    result = result[0];
                }
                if(callBack) callBack(result);
            });
        }
        ,
        save: function(tableName, cols, callBack, where, id, forceInsert)
        {
            var patt = new RegExp(/\./, 'g');
            if(!isObject(cols)) return null;
            if(!where || !isString(where)) where = '';
            var Query = '';
            
            var run = function()
            {
                if(!isNew) 
                {
                    Query += 'Update ' + tableName + ' set ';
                    var QueryUpdate = '';
                    $.each(cols, function(col, value)
                    {
                        if(QueryUpdate != '') QueryUpdate += ", ";
                        QueryUpdate += "`" + col.replace(patt, "`.`") + "`";
                        if(value == null) value = '';
                        QueryUpdate += "=" + (empty(value) || isString(value) ? '"' + value + '"' : value);
                    });
                    Query += QueryUpdate;

                    if(!empty(where)) where += ' and ';
                    where += (id || 'Id') + '=' + cols[id || 'Id'];
                }
                else
                {
                    where = '';
                    Query += 'INSERT INTO ' + tableName;
                    var insertCols = '', insertValues = '';
                    $.each(cols, function(col, value)
                    {
                        if(insertCols != '') 
                        {
                            insertCols += ", "
                            insertValues += ", "
                        }

                        insertCols += "`" + col.replace(patt, "`.`") + "`";
                        if(value == null) value = '';
                        insertValues += empty(value) || isString(value) ? '"' + value + '"' : value;
                    });

                    if(!empty(insertCols) && !empty(insertValues)) Query += ' (' + insertCols + ') VALUES (' + insertValues + ')';
                }

                if(!empty(where))
                    Query += ' WHERE ' + where;

                service.query(Query, function(affectedRows, lastInsertId)
                {
                    if(isNew && empty(lastInsertId)) return false;
                    if(callBack) callBack(affectedRows, lastInsertId);                
                });
            };
            
            var isNew = !(cols[id || 'Id']) > 0;
            
            if(forceInsert && !isNew)
            {
                this.first('SELECT ' + (id || 'Id') + ' FROM '+tableName+' where ' + (id || 'Id') + '=' + cols[id || 'Id'], function(results)
                {
                    if(!results || empty(results[id || 'Id'])) isNew = true;
                    run();
                });
            }
            else run();
        },
        delete: function(tableName, wheres, callBack)
        {
            this.query('DELETE FROM ' + tableName + (wheres ? ' WHERE ' + wheres : ''), function(affectedRows)
            {
                if(callBack) callBack(affectedRows);
            });
        },
        reset: function(tableName, callBack)
        {
            this.query('TRUNCATE TABLE ' + tableName, function(affectedRows)
            {
                if(callBack) callBack(affectedRows);
            });
        },
        count: function(tableName, where, callBack)
        {
            this.query('SELECT count(*) as counts FROM ' + tableName + (where ? ' WHERE ' + where : ''), function(results)
            {
                if(callBack) callBack(results[0] ? results[0].counts : 0);
            });
        }
    };
    
    return service;
});